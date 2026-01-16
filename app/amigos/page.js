"use client";
import { useState, useRef } from "react";
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
  Edit3,
} from "lucide-react";

export default function AmigosPage() {
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("libres_conmigo"); // Iniciamos con un filtro activo
  const [amigoSeleccionado, setAmigoSeleccionado] = useState(null);
  const [idAmigoBase, setIdAmigoBase] = useState("yo");
  const [editandoAmigo, setEditandoAmigo] = useState(null);

  const sectionSubidaRef = useRef(null);

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

  const obtenerDetalleFiltro = (amigo) => {
    const horarioBase =
      idAmigoBase === "yo"
        ? miHorario
        : amigos?.find((a) => a.id === idAmigoBase);
    if (!horarioBase) return null;
    const coincidenciasCompactas = [];
    const norm = (r) => r.replace(/\s/g, "");

    switch (filtroActivo) {
      case "libres_conmigo":
        bloquesTec.forEach((rango) => {
          const diasLibresCompartidos = [];
          diasSemana.forEach((dia) => {
            const matBaseDia = horarioBase.materias.filter(
              (m) => m.dia === dia
            );
            const susMatDia = amigo.materias.filter((m) => m.dia === dia);
            if (matBaseDia.length === 0 || susMatDia.length === 0) return;

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

            const estanciaBase = getEstancia(matBaseDia);
            const estanciaAmigo = getEstancia(susMatDia);
            const iniB = parseInt(norm(rango).split("-")[0].replace(":", ""));
            const finB = parseInt(norm(rango).split("-")[1].replace(":", ""));

            const ambosEnCampus =
              iniB >= Math.max(estanciaBase.entrada, estanciaAmigo.entrada) &&
              finB <= Math.min(estanciaBase.salida, estanciaAmigo.salida);
            if (ambosEnCampus) {
              const baseOcupado = matBaseDia.some(
                (m) => norm(m.rango) === norm(rango)
              );
              const amigoOcupado = susMatDia.some(
                (m) => norm(m.rango) === norm(rango)
              );
              if (!baseOcupado && !amigoOcupado)
                diasLibresCompartidos.push(dia);
            }
          });

          if (diasLibresCompartidos.length > 0) {
            let label =
              diasLibresCompartidos.length === 5
                ? "LUN-VIE"
                : diasLibresCompartidos.length === 1
                ? diasLibresCompartidos[0].slice(0, 2).toUpperCase()
                : `${diasLibresCompartidos[0]
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
        const materiasUnicas = new Set();
        amigo.materias.forEach((sm) => {
          horarioBase.materias.forEach((mm) => {
            const mismoDia = mm.dia === sm.dia;
            const mismoRango = norm(mm.rango) === norm(sm.rango);
            const mismoSalon =
              mm.salon.trim().toLowerCase() === sm.salon.trim().toLowerCase();
            if (mismoDia && mismoRango && mismoSalon) {
              materiasUnicas.add(mm.nombre.toUpperCase());
            }
          });
        });
        materiasUnicas.forEach((m) => coincidenciasCompactas.push(m));
        break;

      case "entrada_comun":
      case "salida_comun":
        diasSemana.forEach((dia) => {
          const misMat = horarioBase.materias.filter((m) => m.dia === dia);
          const susMat = amigo.materias.filter((m) => m.dia === dia);
          if (misMat.length > 0 && susMat.length > 0) {
            const hB =
              filtroActivo === "entrada_comun"
                ? misMat.sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
                    .inicio
                : misMat.sort((a, b) => b.fin.localeCompare(a.fin))[0].fin;
            const hA =
              filtroActivo === "entrada_comun"
                ? susMat.sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
                    .inicio
                : susMat.sort((a, b) => b.fin.localeCompare(a.fin))[0].fin;
            if (hB === hA)
              coincidenciasCompactas.push(
                `${dia.slice(0, 2).toUpperCase()} @ ${hB}`
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
    if (!file) return;
    const nombreFinal = editandoAmigo ? editandoAmigo.nombreUsuario : nombre;
    if (!nombreFinal) {
      alert("Ingresa el nombre antes de subir.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const datos = transformarCSV(event.target.result, nombreFinal);
        if (editandoAmigo) {
          await db.horarios.update(editandoAmigo.id, {
            materias: datos.materias,
          });
          alert(`Horario de ${nombreFinal} actualizado.`);
          setEditandoAmigo(null);
        } else {
          await db.horarios.add({
            nombreUsuario: nombreFinal,
            materias: datos.materias,
            esPrincipal: "false",
            id: `amigo_${Date.now()}`,
          });
          setNombre("");
          alert("Amigo añadido con éxito.");
        }
        e.target.value = "";
      } catch (err) {
        alert("Error: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleEditar = (e, amigo) => {
    e.stopPropagation();
    setEditandoAmigo(amigo);
    sectionSubidaRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const listaResultados =
    amigos?.filter((amigo) => {
      if (amigo.id === idAmigoBase) return false;
      const cumpleNombre = amigo.nombreUsuario
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      if (!cumpleNombre) return false;
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
            placeholder="Buscar por nombre..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-12 outline-none focus:border-tec-blue transition-all"
          />
        </div>
      </header>

      {/* REGISTRO */}
      <section
        ref={sectionSubidaRef}
        className={`bg-card-bg p-6 rounded-[2rem] border transition-all duration-300 flex flex-col md:flex-row gap-4 shadow-2xl ${
          editandoAmigo
            ? "border-accent-purple bg-accent-purple/5 ring-2 ring-accent-purple/20"
            : "border-white/5"
        }`}
      >
        <div className="flex-1 space-y-2">
          <p className="text-[10px] font-black uppercase text-gray-500 ml-2 tracking-widest">
            {editandoAmigo
              ? `Editando a: ${editandoAmigo.nombreUsuario}`
              : "Añadir Nuevo Amigo"}
          </p>
          <input
            value={editandoAmigo ? editandoAmigo.nombreUsuario : nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={!!editandoAmigo}
            placeholder="Nombre del amigo"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-tec-blue disabled:opacity-50 font-bold"
          />
        </div>
        <div className="flex gap-2 items-end">
          {editandoAmigo && (
            <button
              onClick={() => setEditandoAmigo(null)}
              className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          )}
          <label
            className={`px-8 py-4 rounded-2xl font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg ${
              editandoAmigo
                ? "bg-accent-purple text-white animate-pulse"
                : "bg-tec-blue text-white"
            }`}
          >
            <FileUp size={18} />{" "}
            {editandoAmigo ? "ACTUALIZAR CSV" : "IMPORTAR CSV"}
            <input
              type="file"
              className="hidden"
              onChange={manejarSubida}
              accept=".csv"
            />
          </label>
        </div>
      </section>

      {/* SELECTOR DE COMPARACIÓN */}
      <div className="p-4 bg-white/5 rounded-[2rem] border border-white/5 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-inner">
        <span className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap ml-2">
          Comparar contra:
        </span>
        <button
          onClick={() => setIdAmigoBase("yo")}
          className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
            idAmigoBase === "yo"
              ? "bg-tec-blue text-white shadow-lg"
              : "bg-white/5 text-gray-500"
          }`}
        >
          MI HORARIO
        </button>
        {amigos?.map((a) => (
          <button
            key={a.id}
            onClick={() => setIdAmigoBase(a.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
              idAmigoBase === a.id
                ? "bg-accent-purple text-white shadow-lg"
                : "bg-white/5 text-gray-500"
            }`}
          >
            {a.nombreUsuario.toUpperCase()}
          </button>
        ))}
      </div>

      {/* BARRA DE FILTROS INTELIGENTES (Directorio eliminado) */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          {
            id: "libres_conmigo",
            label: "Horas Libres Juntos",
            icon: <Coffee size={14} />,
          },
          {
            id: "materias_comun",
            label: "Misma Clase (Salón)",
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

      {/* RESULTADOS FILTRADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[250px]">
        {listaResultados.map((amigo) => {
          const detalles = obtenerDetalleFiltro(amigo);
          return (
            <div
              key={amigo.id}
              className="p-6 bg-card-bg border border-white/5 rounded-[2.5rem] shadow-xl flex flex-col min-h-[200px]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-tec-blue/10 flex items-center justify-center text-tec-blue font-black text-xl">
                  {amigo.nombreUsuario[0]}
                </div>
                <div className="text-[8px] font-black text-gray-700 uppercase">
                  vs{" "}
                  {idAmigoBase === "yo"
                    ? "Ti"
                    : amigos
                        .find((a) => a.id === idAmigoBase)
                        ?.nombreUsuario.split(" ")[0]}
                </div>
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter truncate">
                {amigo.nombreUsuario}
              </h3>
              <div className="mt-4 flex-1">
                {detalles ? (
                  <div className="flex flex-wrap gap-1">
                    {detalles.map((d, i) => (
                      <span
                        key={i}
                        className="bg-white/5 border border-white/10 text-[9px] px-2 py-1 rounded-lg text-tec-blue font-bold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-600 font-bold uppercase italic text-center py-4">
                    Sin coincidencias
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GESTIÓN DE PERFILES */}
      <section className="pt-20 border-t border-white/5 space-y-6 text-center">
        <h2 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.4em]">
          Perfiles Guardados - Clic para ver horario
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                <button
                  onClick={(e) => handleEditar(e, amigo)}
                  className="bg-tec-blue text-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("¿Borrar amigo?")) db.horarios.delete(amigo.id);
                  }}
                  className="bg-red-500 text-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform"
                >
                  <Trash2 size={12} />
                </button>
              </div>
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
          <div className="relative bg-card-bg w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-white/10 p-6 no-scrollbar shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center mb-8 sticky top-0 bg-card-bg/80 backdrop-blur-md py-2 z-10">
              <h2 className="text-4xl font-black italic uppercase text-tec-blue">
                {amigoSeleccionado.nombreUsuario}
              </h2>
              <button
                onClick={() => setAmigoSeleccionado(null)}
                className="p-4 bg-white/5 rounded-full"
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
