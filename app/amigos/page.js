"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { transformarCSV, obtenerClaseActual } from "@/lib/parser";
import HorarioGrid from "@/components/HorarioGrid";
import {
  UserPlus,
  FileUp,
  Coffee,
  Trash2,
  Users,
  Search,
  Zap,
  DoorOpen,
  X,
  Calendar,
  BookOpen,
  ArrowRightLeft,
  Clock,
} from "lucide-react";

export default function AmigosPage() {
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [amigoSeleccionado, setAmigoSeleccionado] = useState(null);

  const amigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray()
  );
  const miHorario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first()
  );

  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  const bloquesTec = [
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
  ];

  // --- LÓGICA DE DETALLE Y COMPACTACIÓN SEMANAL ---
  const obtenerDetalleFiltro = (amigo) => {
    if (!miHorario) return null;
    const coincidenciasCompactas = [];
    const norm = (r) => r.replace(/\s/g, "");

    switch (filtroActivo) {
      case "libres_conmigo":
        bloquesTec.forEach((rango) => {
          const diasLibresCompartidos = [];

          diasSemana.forEach((dia) => {
            const misMatDia = miHorario.materias.filter((m) => m.dia === dia);
            const susMatDia = amigo.materias.filter((m) => m.dia === dia);

            if (misMatDia.length === 0 || susMatDia.length === 0) return;

            // Obtener rango de jornada real (desde la primera clase hasta la última)
            const getEstancia = (mats) => {
              const inicios = mats.map((m) =>
                parseInt(norm(m.rango).split("-")[0].replace(":", ""))
              );
              const fines = mats.map((m) =>
                parseInt(norm(m.rango).split("-")[1].replace(":", ""))
              );
              return {
                entrada: Math.min(...inicios),
                salida: Math.max(...fines),
              };
            };

            const miEstancia = getEstancia(misMatDia);
            const suEstancia = getEstancia(susMatDia);
            const inicioBloque = parseInt(
              norm(rango).split("-")[0].replace(":", "")
            );
            const finBloque = parseInt(
              norm(rango).split("-")[1].replace(":", "")
            );

            // Solo es libre si AMBOS están ya en el Tec (entre su primera y última clase)
            const ambosEnCampus =
              inicioBloque >=
                Math.max(miEstancia.entrada, suEstancia.entrada) &&
              finBloque <= Math.min(miEstancia.salida, suEstancia.salida);

            if (ambosEnCampus) {
              const yoOcupado = misMatDia.some(
                (m) => norm(m.rango) === norm(rango)
              );
              const elOcupado = susMatDia.some(
                (m) => norm(m.rango) === norm(rango)
              );
              if (!yoOcupado && !elOcupado) diasLibresCompartidos.push(dia);
            }
          });

          // Compactar (LUN-VIE, etc.)
          if (diasLibresCompartidos.length > 0) {
            let label = "";
            if (diasLibresCompartidos.length === 5) label = "LUN-VIE";
            else if (diasLibresCompartidos.length === 1)
              label = diasLibresCompartidos[0].slice(0, 2).toUpperCase();
            else
              label = `${diasLibresCompartidos[0]
                .slice(0, 2)
                .toUpperCase()}-${diasLibresCompartidos[
                diasLibresCompartidos.length - 1
              ]
                .slice(0, 2)
                .toUpperCase()}`;

            coincidenciasCompactas.push(`${label} ${rango.split(" ")[0]}`);
          }
        });
        break;

      case "materias_comun":
        const materiasVistas = new Set();
        amigo.materias.forEach((sm) => {
          miHorario.materias.forEach((mm) => {
            if (
              mm.nombre.toLowerCase().trim() === sm.nombre.toLowerCase().trim()
            ) {
              materiasVistas.add(mm.nombre.toUpperCase());
            }
          });
        });
        materiasVistas.forEach((m) => coincidenciasCompactas.push(m));
        break;

      case "entrada_comun":
      case "salida_comun":
        diasSemana.forEach((dia) => {
          const misMat = miHorario.materias.filter((m) => m.dia === dia);
          const susMat = amigo.materias.filter((m) => m.dia === dia);
          if (misMat.length > 0 && susMat.length > 0) {
            const miHora =
              filtroActivo === "entrada_comun"
                ? misMat.sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
                    .inicio
                : misMat.sort((a, b) => b.fin.localeCompare(a.fin))[0].fin;
            const suHora =
              filtroActivo === "entrada_comun"
                ? susMat.sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
                    .inicio
                : susMat.sort((a, b) => b.fin.localeCompare(a.fin))[0].fin;

            if (miHora === suHora)
              coincidenciasCompactas.push(
                `${dia.slice(0, 2).toUpperCase()} @ ${miHora}`
              );
          }
        });
        break;
    }
    return coincidenciasCompactas.length > 0
      ? [...new Set(coincidenciasCompactas)]
      : null;
  };

  const manejarSubida = async (e) => {
    const file = e.target.files[0];
    if (!file || !nombre) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const datos = transformarCSV(event.target.result, nombre);
        await db.horarios.add({
          nombreUsuario: nombre,
          materias: datos.materias,
          esPrincipal: "false",
          id: `amigo_${Date.now()}`,
        });
        setNombre("");
        e.target.value = "";
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
  };

  const listaResultados =
    amigos?.filter((amigo) => {
      const cumpleNombre = amigo.nombreUsuario
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      if (!cumpleNombre) return false;
      if (filtroActivo === "todos") return true;
      const detalle = obtenerDetalleFiltro(amigo);
      return !!detalle;
    }) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <h1 className="text-5xl font-black italic tracking-tighter text-tec-blue uppercase">
          Network
        </h1>
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar por nombre..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-12 outline-none focus:border-tec-blue transition-all"
          />
        </div>
      </header>

      {/* REGISTRO */}
      <section className="bg-card-bg p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-4">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del amigo"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-tec-blue"
        />
        <label className="bg-tec-blue px-8 py-4 rounded-2xl font-black text-xs cursor-pointer flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
          <FileUp size={18} /> IMPORTAR CSV{" "}
          <input
            type="file"
            className="hidden"
            onChange={manejarSubida}
            accept=".csv"
          />
        </label>
      </section>

      {/* FILTROS */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: "todos", label: "Directorio", icon: <Users size={14} /> },
          {
            id: "libres_conmigo",
            label: "Horas Libres Juntos",
            icon: <Coffee size={14} />,
          },
          {
            id: "materias_comun",
            label: "Misma Clase",
            icon: <BookOpen size={14} />,
          },
          {
            id: "entrada_comun",
            label: "Misma Entrada",
            icon: <DoorOpen size={14} />,
          },
          {
            id: "salida_comun",
            label: "Misma Salida",
            icon: <ArrowRightLeft size={14} />,
          },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltroActivo(f.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
              filtroActivo === f.id
                ? "bg-white text-black border-white shadow-xl"
                : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10"
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* RESULTADOS FILTRADOS (SIN MODAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listaResultados.map((amigo) => {
          const detalles = obtenerDetalleFiltro(amigo);
          return (
            <div
              key={amigo.id}
              className="p-6 bg-card-bg border border-white/5 rounded-[2.5rem] shadow-xl flex flex-col min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-tec-blue/10 flex items-center justify-center text-tec-blue font-black text-xl mb-4">
                {amigo.nombreUsuario[0]}
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter truncate">
                {amigo.nombreUsuario}
              </h3>
              <div className="mt-4 flex-1">
                {detalles ? (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-tec-blue uppercase tracking-widest">
                      Coincidencias:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {detalles.map((d, i) => (
                        <span
                          key={i}
                          className="bg-white/5 border border-white/10 text-[9px] px-2 py-1 rounded-lg text-gray-300 font-bold"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-600 font-bold uppercase italic">
                    Sin resultados
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DIRECTORIO COMPLETO (SÍ ABRE MODAL) */}
      <section className="pt-20 border-t border-white/5 space-y-6 text-center">
        <h2 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.4em]">
          Directorio - Haz clic para ver horario
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
          {amigos?.map((amigo) => (
            <div
              key={amigo.id}
              onClick={() => setAmigoSeleccionado(amigo)}
              className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center group relative hover:bg-white/10 hover:border-tec-blue/50 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 font-black mb-2 group-hover:text-tec-blue transition-colors">
                {amigo.nombreUsuario[0]}
              </div>
              <span className="font-bold text-[11px] uppercase truncate w-full">
                {amigo.nombreUsuario}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  db.horarios.delete(amigo.id);
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL HORARIO */}
      {amigoSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setAmigoSeleccionado(null)}
          />
          <div className="relative bg-card-bg w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-white/10 p-6 no-scrollbar shadow-2xl">
            <header className="flex justify-between items-center mb-8 sticky top-0 bg-card-bg/80 backdrop-blur-md py-2 z-10">
              <h2 className="text-4xl font-black italic uppercase text-tec-blue">
                {amigoSeleccionado.nombreUsuario}
              </h2>
              <button
                onClick={() => setAmigoSeleccionado(null)}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </header>
            <HorarioGrid horario={amigoSeleccionado} />
          </div>
        </div>
      )}
    </div>
  );
}
