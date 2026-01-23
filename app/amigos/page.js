"use client";
import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { transformarCSV, formatearRango } from "@/lib/parser";
import HorarioGrid from "@/components/HorarioGrid";
import EditorHorarioManual from "@/components/EditorHorarioManual";
import GuiaCSV from "@/components/GuiaCSV";
import {
  FileUp,
  Users,
  Search,
  X,
  BookOpen,
  Clock,
  Edit3,
  Trash2,
  Info,
  Keyboard,
  Coffee,
  DoorOpen,
  ArrowRightLeft,
} from "lucide-react";

export default function AmigosPage() {
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("libres_conmigo");
  const [amigoSeleccionado, setAmigoSeleccionado] = useState(null);
  const [idAmigoBase, setIdAmigoBase] = useState("yo");
  const [editandoAmigo, setEditandoAmigo] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false); // Estado para la Guía
  const [showManual, setShowManual] = useState(false);

  const sectionSubidaRef = useRef(null);

  // --- CONSULTAS REACTIVAS ---
  const amigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray(),
  );
  const miHorario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first(),
  );
  const perfil = useLiveQuery(() => db.perfil.toCollection().first());
  const formatoHora = perfil?.formatoHora || 24;

  const bloquesTec = [
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
  ];
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  const guardarDesdeEditor = async (data) => {
    if (editandoAmigo) {
      await db.horarios.update(editandoAmigo.id, {
        nombreUsuario: data.nombreUsuario,
        materias: data.materias,
      });
      setEditandoAmigo(null);
    } else {
      await db.horarios.add({
        ...data,
        esPrincipal: "false",
        id: `amigo_${Date.now()}`,
      });
    }
    setShowManual(false);
    setNombre("");
  };

  const manejarSubidaCSV = async (e) => {
    const file = e.target.files[0];
    if (!file || !nombre) return alert("Ingresa el nombre antes de subir.");
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
      } catch (err) {
        alert("Error de formato. Revisa la guía (i)");
      }
    };
    reader.readAsText(file);
  };

  const handleEditar = (e, amigo) => {
    e.stopPropagation();
    setEditandoAmigo(amigo);
    setNombre(amigo.nombreUsuario);
    setShowManual(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- LÓGICA DE FILTROS ---
  const obtenerDetalleFiltro = (amigo) => {
    const horarioBase =
      idAmigoBase === "yo"
        ? miHorario
        : amigos?.find((a) => a.id === idAmigoBase);
    if (!horarioBase || !amigo) return null;
    const coincidenciasCompactas = [];
    const norm = (r) => (r || "").replace(/\s/g, "");

    const getLimites = (mats, dia) => {
      if (!mats) return null;
      const diaMats = mats.filter((m) => m.dia === dia);
      if (diaMats.length === 0) return null;
      const mins = diaMats.map((m) =>
        parseInt((m.inicio || "0").replace(":", "")),
      );
      const maxs = diaMats.map((m) =>
        parseInt((m.fin || "0").replace(":", "")),
      );
      return { entrada: Math.min(...mins), salida: Math.max(...maxs) };
    };

    switch (filtroActivo) {
      case "libres_conmigo":
        bloquesTec.forEach((rango) => {
          const diasLibresCompartidos = [];
          diasSemana.forEach((dia) => {
            const limBase = getLimites(horarioBase.materias, dia);
            const limAmigo = getLimites(amigo.materias, dia);
            if (!limBase || !limAmigo) return;
            const tBloqueIni = parseInt(
              norm(rango).split("-")[0].replace(":", ""),
              10,
            );
            const tBloqueFin = parseInt(
              norm(rango).split("-")[1].replace(":", ""),
              10,
            );
            if (
              tBloqueIni >= Math.max(limBase.entrada, limAmigo.entrada) &&
              tBloqueFin <= Math.min(limBase.salida, limAmigo.salida)
            ) {
              const baseOcupado = horarioBase.materias.some(
                (m) => m.dia === dia && norm(m.rango) === norm(rango),
              );
              const amigoOcupado = amigo.materias.some(
                (m) => m.dia === dia && norm(m.rango) === norm(rango),
              );
              if (!baseOcupado && !amigoOcupado)
                diasLibresCompartidos.push(dia);
            }
          });
          if (diasLibresCompartidos.length > 0) {
            const horaFormateada = formatearRango(rango, formatoHora)
              .split("-")[0]
              .trim();
            coincidenciasCompactas.push(
              `${diasLibresCompartidos[0].slice(0, 2).toUpperCase()} ${horaFormateada}`,
            );
          }
        });
        break;
      case "entrada_comun":
      case "salida_comun":
        diasSemana.forEach((dia) => {
          const limB = getLimites(horarioBase.materias, dia);
          const limA = getLimites(amigo.materias, dia);
          if (limB && limA) {
            if (
              filtroActivo === "entrada_comun" &&
              limB.entrada === limA.entrada
            ) {
              const mat = horarioBase.materias.find(
                (m) =>
                  m.dia === dia &&
                  parseInt(m.inicio.replace(":", "")) === limB.entrada,
              );
              if (mat)
                coincidenciasCompactas.push(
                  `${dia.slice(0, 2).toUpperCase()} @ ${formatearRango(mat.rango, formatoHora).split("-")[0]}`,
                );
            }
            if (
              filtroActivo === "salida_comun" &&
              limB.salida === limA.salida
            ) {
              const mat = horarioBase.materias.find(
                (m) =>
                  m.dia === dia &&
                  parseInt(m.fin.replace(":", "")) === limB.salida,
              );
              if (mat)
                coincidenciasCompactas.push(
                  `${dia.slice(0, 2).toUpperCase()} @ ${formatearRango(mat.rango, formatoHora).split("-")[1]}`,
                );
            }
          }
        });
        break;
      case "materias_comun":
        const comunes = new Set();
        amigo.materias.forEach((sm) => {
          if (
            horarioBase.materias.some(
              (mm) =>
                mm.dia === sm.dia &&
                norm(mm.rango) === norm(sm.rango) &&
                mm.salon.toLowerCase() === sm.salon.toLowerCase(),
            )
          ) {
            comunes.add(sm.nombre.toUpperCase());
          }
        });
        comunes.forEach((c) => coincidenciasCompactas.push(c));
        break;
    }
    return coincidenciasCompactas.length > 0
      ? [...new Set(coincidenciasCompactas)]
      : null;
  };

  const resultadosFiltrados = (() => {
    let base = amigos ? [...amigos] : [];
    if (idAmigoBase !== "yo" && miHorario) {
      base.push({
        ...miHorario,
        nombreUsuario: `${perfil?.nombre || "Usuario"} (Tú)`,
        id: "yo_temp",
      });
    }
    return base.filter((item) => {
      if (
        item.id === idAmigoBase ||
        (idAmigoBase === "yo" && item.id === "yo_temp")
      )
        return false;
      const cumpleNombre = item.nombreUsuario
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      return cumpleNombre && obtenerDetalleFiltro(item);
    });
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in relative px-2 text-white">
      {/* MODAL DEL EDITOR */}
      {showManual && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
          onClick={() => {
            setShowManual(false);
            setEditandoAmigo(null);
            setNombre("");
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EditorHorarioManual
              key={editandoAmigo?.id || "nuevo"}
              nombreInicial={nombre}
              materiasIniciales={editandoAmigo?.materias || []}
              onCancel={() => {
                setShowManual(false);
                setEditandoAmigo(null);
                setNombre("");
              }}
              onSave={guardarDesdeEditor}
            />
          </div>
        </div>
      )}

      {/* MODAL DE LA GUÍA CSV */}
      {showInfoModal && <GuiaCSV onClose={() => setShowInfoModal(false)} />}

      {/* BOTÓN FLOTANTE DE INFO / GUÍA */}
      <button
        onClick={() => setShowInfoModal(true)}
        className="fixed bottom-24 right-8 z-[150] p-4 bg-tec-blue text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10"
      >
        <Info size={24} />
      </button>

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
            placeholder="Buscar amigo..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-12 outline-none focus:border-tec-blue transition-all"
          />
        </div>
      </header>

      {/* SECCIÓN DE AGREGAR / EDITAR */}
      <section
        ref={sectionSubidaRef}
        className="bg-card-bg p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-4"
      >
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
            {editandoAmigo
              ? `Modificando: ${editandoAmigo.nombreUsuario}`
              : "Nuevo Integrante"}
          </p>
          <button
            onClick={() => setShowInfoModal(true)}
            className="text-[9px] font-black text-tec-blue uppercase hover:underline flex items-center gap-1"
          >
            <Info size={12} /> Guía de Formato
          </button>
        </div>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del amigo..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-tec-blue font-bold text-white shadow-inner"
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowManual(true)}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] text-gray-400 hover:text-white transition-all uppercase flex items-center justify-center gap-2"
          >
            <Keyboard size={16} />{" "}
            {editandoAmigo ? "Editar Manualmente" : "Registro Manual"}
          </button>
          <label className="flex-1 py-4 bg-tec-blue text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:bg-blue-600 transition-all">
            <FileUp size={16} />{" "}
            {editandoAmigo ? "REEMPLAZAR CSV" : "IMPORTAR CSV"}
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={manejarSubidaCSV}
            />
          </label>
        </div>
      </section>

      {/* FILTROS Y RESULTADOS */}
      <div className="space-y-4">
        {/* Selector de Sujeto Base */}
        <div className="p-4 bg-white/5 rounded-[2rem] border border-white/5 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-inner">
          <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap ml-2">
            Sujeto Base:
          </span>
          <button
            onClick={() => setIdAmigoBase("yo")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${idAmigoBase === "yo" ? "bg-tec-blue text-white shadow-lg" : "bg-white/5 text-gray-500"}`}
          >
            MI HORARIO
          </button>
          {amigos?.map((a) => (
            <button
              key={a.id}
              onClick={() => setIdAmigoBase(a.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${idAmigoBase === a.id ? "bg-accent-purple text-white shadow-lg" : "bg-white/5 text-gray-500"}`}
            >
              {a.nombreUsuario.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Chips de Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            {
              id: "libres_conmigo",
              label: "Huecos",
              icon: <Coffee size={14} />,
            },
            {
              id: "materias_comun",
              label: "Clases",
              icon: <BookOpen size={14} />,
            },
            {
              id: "entrada_comun",
              label: "Entrada",
              icon: <DoorOpen size={14} />,
            },
            {
              id: "salida_comun",
              label: "Salida",
              icon: <ArrowRightLeft size={14} />,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroActivo(f.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filtroActivo === f.id ? "bg-white text-black border-white shadow-xl" : "bg-white/5 text-gray-500 border-white/5"}`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Grid de Resultados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resultadosFiltrados.map((amigo) => (
            <div
              key={amigo.id}
              onClick={() => setAmigoSeleccionado(amigo)}
              className={`p-6 border rounded-[2.5rem] shadow-xl flex flex-col min-h-[160px] transition-all cursor-pointer hover:scale-[1.02] ${amigo.id === "yo_temp" ? "bg-tec-blue/10 border-tec-blue/30" : "bg-card-bg border-white/5"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${amigo.id === "yo_temp" ? "bg-tec-blue text-white" : "bg-tec-blue/10 text-tec-blue"}`}
                >
                  {amigo.nombreUsuario[0]}
                </div>
                <div className="text-[8px] font-black text-gray-500 uppercase">
                  Coincidencia
                </div>
              </div>
              <h3 className="text-lg font-black italic uppercase truncate">
                {amigo.nombreUsuario}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1">
                {obtenerDetalleFiltro(amigo)?.map((d, i) => (
                  <span
                    key={i}
                    className="bg-white/5 border border-white/10 text-[8px] px-2 py-1 rounded-lg text-tec-blue font-bold"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIRECTORIO */}
      <section className="pt-16 border-t border-white/5 space-y-8 text-center">
        <h2 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.4em]">
          Directorio de Red
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {amigos?.map((amigo) => (
            <div
              key={amigo.id}
              className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center group relative hover:bg-white/10 transition-all shadow-lg"
            >
              <div
                onClick={() => setAmigoSeleccionado(amigo)}
                className="cursor-pointer flex flex-col items-center w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 font-black mb-2">
                  {amigo.nombreUsuario[0]}
                </div>
                <span className="font-bold text-[10px] uppercase truncate w-full text-center">
                  {amigo.nombreUsuario}
                </span>
              </div>
              <div className="absolute -top-2 -right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                <button
                  onClick={(e) => handleEditar(e, amigo)}
                  className="bg-tec-blue text-white p-2.5 rounded-full shadow-2xl hover:scale-110 active:scale-95"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Borrar a ${amigo.nombreUsuario}?`))
                      db.horarios.delete(amigo.id);
                  }}
                  className="bg-red-500 text-white p-2.5 rounded-full shadow-2xl hover:scale-110 active:scale-95"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VISOR DE HORARIO */}
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
