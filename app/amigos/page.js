"use client";
import { useState, useRef, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  transformarCSV,
  formatearRango,
  obtenerClaseActual,
} from "@/lib/parser";
import HorarioGrid from "@/components/HorarioGrid";
import EditorHorarioManual from "@/components/EditorHorarioManual";
import GuiaCSV from "@/components/GuiaCSV";
import { toPng } from "html-to-image";
import {
  FileUp,
  Search,
  X,
  BookOpen,
  Edit3,
  Trash2,
  Info,
  Keyboard,
  Coffee,
  DoorOpen,
  ArrowRightLeft,
  Clock,
  Users,
  Camera,
  Plus,
  UserPlus,
  Check,
  UserCheck,
  Zap,
  HelpCircle,
  Eye,
} from "lucide-react";

export default function AmigosPage() {
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("libres_conmigo");
  const [amigoSeleccionado, setAmigoSeleccionado] = useState(null);
  const [amigoParaGrupo, setAmigoParaGrupo] = useState(null);
  const [idAmigoBase, setIdAmigoBase] = useState("yo");
  const [editandoAmigo, setEditandoAmigo] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Estados para comparación de 3 o más
  const [seleccionados, setSeleccionados] = useState([]);
  const [showComparadorGrupal, setShowComparadorGrupal] = useState(false);

  // Estado para interacción móvil en Directorio
  const [activeOptionsId, setActiveOptionsId] = useState(null);

  const [grupoFiltro, setGrupoFiltro] = useState("todos");
  const screenshotRef = useRef(null);
  const sectionSubidaRef = useRef(null);

  // --- CONSULTAS REACTIVAS ---
  const amigos =
    useLiveQuery(() => db.horarios.where({ esPrincipal: "false" }).toArray()) ||
    [];
  const grupos = useLiveQuery(() => db.grupos?.toArray() || []) || [];
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

  // --- LÓGICA DE CAPTURA (SOLUCIÓN DEFINITIVA PARA MÓVIL) ---
  const descargarCaptura = async () => {
    if (!screenshotRef.current) return;

    // Obtenemos el elemento que contiene el horario real
    const node = screenshotRef.current;

    try {
      // Calculamos el ancho real del contenido (los 5 días)
      // Usamos un valor base de 800px si el scrollWidth es menor, para asegurar calidad
      const actualWidth = Math.max(node.scrollWidth, 800);
      const actualHeight = node.scrollHeight;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: "#050505",
        width: actualWidth,
        height: actualHeight,
        style: {
          width: `${actualWidth}px`,
          height: `${actualHeight}px`,
          transform: "none",
          margin: "0",
          padding: "20px",
        },
        pixelRatio: 2, // Buena calidad sin ser demasiado pesado para el cel
      });

      const link = document.createElement("a");
      link.download = `Horario_${amigoSeleccionado.nombreUsuario}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Error al capturar el horario completo.");
    }
  };

  const manejarCrearGrupo = async () => {
    const nombreG = prompt("Nombre del nuevo grupo:");
    if (!nombreG) return;
    await db.grupos.add({ nombre: nombreG, integrantes: [] });
  };

  const borrarGrupo = async (e, id) => {
    e.stopPropagation();
    if (confirm("¿Borrar este grupo?")) {
      await db.grupos.delete(id);
      if (grupoFiltro === id) setGrupoFiltro("todos");
    }
  };

  const toggleIntegrante = async (grupo, amigoId) => {
    const integrantesActuales = grupo.integrantes || [];
    const nuevosIntegrantes = integrantesActuales.includes(amigoId)
      ? integrantesActuales.filter((id) => id !== amigoId)
      : [...integrantesActuales, amigoId];
    await db.grupos.update(grupo.id, { integrantes: nuevosIntegrantes });
  };

  const toggleSeleccionComparar = (e, amigo) => {
    e.stopPropagation();
    setSeleccionados((prev) =>
      prev.find((s) => s.id === amigo.id)
        ? prev.filter((s) => s.id !== amigo.id)
        : [...prev, amigo],
    );
  };

  const handleFriendClick = (amigo) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setActiveOptionsId(activeOptionsId === amigo.id ? null : amigo.id);
    } else {
      setAmigoSeleccionado(amigo);
    }
  };

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
        alert("Error de formato.");
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

  const getLimites = (mats, dia) => {
    if (!mats || mats.length === 0) return null;
    const diaMats = mats.filter((m) => m.dia === dia);
    if (diaMats.length === 0) return null;
    const mins = diaMats.map((m) =>
      parseInt((m.inicio || "0").replace(":", "")),
    );
    const maxs = diaMats.map((m) => parseInt((m.fin || "0").replace(":", "")));
    return { entrada: Math.min(...mins), salida: Math.max(...maxs) };
  };

  const obtenerDetalleFiltro = (amigo) => {
    const horarioBase =
      idAmigoBase === "yo"
        ? miHorario
        : amigos?.find((a) => a.id === idAmigoBase);
    if (!amigo) return null;
    const coincidenciasCompactas = [];
    const norm = (r) => (r || "").replace(/\s/g, "");
    const diaHoy = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ][new Date().getDay()];

    switch (filtroActivo) {
      case "libres_ahora":
        const limA = getLimites(amigo.materias, diaHoy);
        if (limA) {
          const ahora = new Date();
          const horaH = ahora.getHours() * 100 + ahora.getMinutes();
          const tieneClase = obtenerClaseActual(amigo.materias);
          if (!tieneClase && horaH >= limA.entrada && horaH < limA.salida)
            coincidenciasCompactas.push("LIBRE EN EL TEC");
        }
        break;
      case "mis_libres":
        bloquesTec.forEach((rango) => {
          const diasL = [];
          diasSemana.forEach((dia) => {
            const lim = getLimites(amigo.materias, dia);
            if (!lim) return;
            const [bI, bF] = norm(rango)
              .split("-")
              .map((t) => parseInt(t.replace(":", "")));
            if (bI >= lim.entrada && bF <= lim.salida) {
              const ocupado = amigo.materias.some(
                (m) => m.dia === dia && norm(m.rango) === norm(rango),
              );
              if (!ocupado) diasL.push(dia);
            }
          });
          if (diasL.length > 0) {
            const h = formatearRango(rango, formatoHora).split("-")[0].trim();
            const dI = diasL[0].slice(0, 3).toUpperCase();
            const dF = diasL[diasL.length - 1].slice(0, 3).toUpperCase();
            coincidenciasCompactas.push(
              `${diasL.length > 1 ? `${dI}-${dF}` : dI} @ ${h}`,
            );
          }
        });
        break;
      case "libres_conmigo":
        if (!horarioBase) return null;
        bloquesTec.forEach((rango) => {
          const diasLC = [];
          diasSemana.forEach((dia) => {
            const limB = getLimites(horarioBase.materias, dia);
            const limA = getLimites(amigo.materias, dia);
            if (!limB || !limA) return;
            const [bI, bF] = norm(rango)
              .split("-")
              .map((t) => parseInt(t.replace(":", "")));
            if (
              bI >= Math.max(limB.entrada, limA.entrada) &&
              bF <= Math.min(limB.salida, limA.salida)
            ) {
              const bOcupado = horarioBase.materias.some(
                (m) => m.dia === dia && norm(m.rango) === norm(rango),
              );
              const aOcupado = amigo.materias.some(
                (m) => m.dia === dia && norm(m.rango) === norm(rango),
              );
              if (!bOcupado && !aOcupado) diasLC.push(dia);
            }
          });
          if (diasLC.length > 0) {
            const h = formatearRango(rango, formatoHora).split("-")[0].trim();
            const dI = diasLC[0].slice(0, 3).toUpperCase();
            const dF = diasLC[diasLC.length - 1].slice(0, 3).toUpperCase();
            coincidenciasCompactas.push(
              `${diasLC.length > 1 ? `${dI}-${dF}` : dI} @ ${h}`,
            );
          }
        });
        break;
      case "materias_comun":
        if (!horarioBase) return null;
        amigo.materias.forEach((sm) => {
          if (
            horarioBase.materias.some(
              (mm) =>
                mm.dia === sm.dia &&
                norm(mm.rango) === norm(sm.rango) &&
                mm.salon.toLowerCase() === sm.salon.toLowerCase(),
            )
          ) {
            coincidenciasCompactas.push(sm.nombre.toUpperCase());
          }
        });
        break;
      case "entrada_comun":
        if (!horarioBase) return null;
        diasSemana.forEach((dia) => {
          const lB = getLimites(horarioBase.materias, dia);
          const lA = getLimites(amigo.materias, dia);
          if (lB && lA && lB.entrada === lA.entrada) {
            const h = Math.floor(lB.entrada / 100);
            const m = lB.entrada % 100;
            const hF = formatearRango(
              `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} - 00:00`,
              formatoHora,
            )
              .split("-")[0]
              .trim();
            coincidenciasCompactas.push(
              `${dia.slice(0, 3).toUpperCase()} @ ${hF}`,
            );
          }
        });
        break;
      case "salida_comun":
        if (!horarioBase) return null;
        diasSemana.forEach((dia) => {
          const lB = getLimites(horarioBase.materias, dia);
          const lA = getLimites(amigo.materias, dia);
          if (lB && lA && lB.salida === lA.salida) {
            const h = Math.floor(lB.salida / 100);
            const m = lB.salida % 100;
            const hF = formatearRango(
              `00:00 - ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
              formatoHora,
            )
              .split("-")[1]
              .trim();
            coincidenciasCompactas.push(
              `${dia.slice(0, 3).toUpperCase()} @ ${hF}`,
            );
          }
        });
        break;
    }
    return coincidenciasCompactas.length > 0
      ? [...new Set(coincidenciasCompactas)]
      : null;
  };

  const resultadosFiltrados = useMemo(() => {
    if (filtroActivo === "mis_libres") {
      const base =
        idAmigoBase === "yo"
          ? {
              ...miHorario,
              nombreUsuario: `${perfil?.nombre || "Usuario"} (Tú)`,
              id: "yo_temp",
            }
          : amigos.find((a) => a.id === idAmigoBase);
      return base ? [base] : [];
    }
    let base = [...amigos];
    if (grupoFiltro !== "todos") {
      const g = grupos.find((g) => g.id === grupoFiltro);
      if (g) base = base.filter((a) => (g.integrantes || []).includes(a.id));
    }
    if (idAmigoBase !== "yo" && miHorario)
      base.push({
        ...miHorario,
        nombreUsuario: `${perfil?.nombre || "Usuario"} (Tú)`,
        id: "yo_temp",
      });
    return base.filter((item) => {
      if (
        item.id === idAmigoBase ||
        (idAmigoBase === "yo" && item.id === "yo_temp")
      )
        return false;
      const busq = busqueda.toLowerCase();
      const cumpleNombre = item.nombreUsuario.toLowerCase().includes(busq);
      const cumpleMateria =
        item.materias?.some((m) => m.nombre.toLowerCase().includes(busq)) ||
        false;
      if (filtroActivo === "comparar_grupal")
        return cumpleNombre || cumpleMateria;
      return (cumpleNombre || cumpleMateria) && obtenerDetalleFiltro(item);
    });
  }, [
    amigos,
    grupos,
    grupoFiltro,
    miHorario,
    idAmigoBase,
    busqueda,
    filtroActivo,
    perfil,
  ]);

  const huecosGrupales = useMemo(() => {
    if (seleccionados.length < 3) return [];
    const intersection = [];
    const norm = (r) => (r || "").replace(/\s/g, "");
    diasSemana.forEach((dia) => {
      bloquesTec.forEach((rango) => {
        const todosLibres = seleccionados.every((persona) => {
          const lim = getLimites(persona.materias, dia);
          if (!lim) return false;
          const [bI, bF] = norm(rango)
            .split("-")
            .map((t) => parseInt(t.replace(":", "")));
          const estaEnTec = bI >= lim.entrada && bF <= lim.salida;
          const estaOcupado = persona.materias.some(
            (m) => m.dia === dia && norm(m.rango) === norm(rango),
          );
          return estaEnTec && !estaOcupado;
        });
        if (todosLibres) intersection.push({ dia, rango });
      });
    });
    return intersection;
  }, [seleccionados]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in relative px-2 text-white">
      {/* MODALES GESTIÓN */}
      {amigoParaGrupo && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60"
          onClick={() => setAmigoParaGrupo(null)}
        >
          <div
            className="bg-card-bg border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase text-tec-blue italic">
                Asignar Grupos
              </h3>
              <button
                onClick={() => setAmigoParaGrupo(null)}
                className="p-2 bg-white/5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {grupos.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleIntegrante(g, amigoParaGrupo.id)}
                  className={`w-full p-4 rounded-2xl border transition-all flex justify-between items-center ${g.integrantes?.includes(amigoParaGrupo.id) ? "bg-purple-600/20 border-purple-500 text-white" : "bg-white/5 border-white/5 text-gray-500"}`}
                >
                  <span className="text-xs font-black uppercase">
                    {g.nombre}
                  </span>
                  {g.integrantes?.includes(amigoParaGrupo.id) ? (
                    <Check size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {showInfoModal && <GuiaCSV onClose={() => setShowInfoModal(false)} />}

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
            placeholder="Nombre o materia..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-12 outline-none focus:border-tec-blue transition-all"
          />
        </div>
      </header>

      {/* SECCIÓN SUBIDA */}
      <section
        ref={sectionSubidaRef}
        className="bg-card-bg p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-4"
      >
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del amigo..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-tec-blue font-bold text-white shadow-inner"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowManual(true)}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] text-gray-400 uppercase flex items-center justify-center gap-2"
          >
            <Keyboard size={16} /> Registro Manual
          </button>
          <label className="flex-1 py-4 bg-tec-blue text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all">
            <FileUp size={16} /> IMPORTAR CSV
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={manejarSubidaCSV}
            />
          </label>
        </div>
      </section>

      {/* FILTROS Y GRUPOS */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setGrupoFiltro("todos")}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${grupoFiltro === "todos" ? "bg-tec-blue text-white shadow-lg shadow-tec-blue/20" : "bg-white/5 text-gray-500"}`}
          >
            <Users size={14} /> TODOS
          </button>
          {grupos.map((g) => (
            <div key={g.id} className="relative group">
              <button
                onClick={() => setGrupoFiltro(g.id)}
                className={`pl-5 pr-10 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${grupoFiltro === g.id ? "bg-purple-600 text-white" : "bg-white/5 text-gray-500"}`}
              >
                <BookOpen size={14} /> {g.nombre}
              </button>
              <button
                onClick={(e) => borrarGrupo(e, g.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/20 rounded-md text-gray-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={manejarCrearGrupo}
            className="px-5 py-2 rounded-xl bg-white/5 text-tec-blue border border-white/5 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Plus size={14} /> GRUPO
          </button>
        </div>

        <div className="p-4 bg-white/5 rounded-[2rem] border border-white/5 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-inner">
          <span className="text-[10px] font-black uppercase text-gray-400 ml-2 whitespace-nowrap">
            Sujeto Base:
          </span>
          <button
            onClick={() => setIdAmigoBase("yo")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${idAmigoBase === "yo" ? "bg-tec-blue text-white" : "bg-white/5 text-gray-500"}`}
          >
            MI HORARIO
          </button>
          {amigos?.map((a) => (
            <button
              key={a.id}
              onClick={() => setIdAmigoBase(a.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${idAmigoBase === a.id ? "bg-accent-purple text-white" : "bg-white/5 text-gray-500"}`}
            >
              {a.nombreUsuario.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            {
              id: "libres_ahora",
              label: "Libre Ahora",
              icon: <Clock size={14} />,
            },
            {
              id: "mis_libres",
              label: "Mis Libres",
              icon: <Check size={14} />,
            },
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
            {
              id: "comparar_grupal",
              label: "Comparar (3+)",
              icon: <Users size={14} />,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroActivo(f.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase border transition-all ${filtroActivo === f.id ? "bg-white text-black border-white shadow-xl" : "bg-white/5 text-gray-500 border-white/5"}`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* RESULTADOS LISTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resultadosFiltrados.map((amigo) => (
            <div
              key={amigo.id}
              onClick={() => setAmigoSeleccionado(amigo)}
              className={`p-6 border rounded-[2.5rem] shadow-xl flex flex-col min-h-[160px] transition-all cursor-pointer hover:scale-[1.02] relative group ${seleccionados.find((s) => s.id === amigo.id) ? "border-tec-blue ring-1 ring-tec-blue" : "border-white/5"} ${amigo.id === "yo_temp" ? "bg-tec-blue/10" : "bg-card-bg"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${amigo.id === "yo_temp" ? "bg-tec-blue text-white" : "bg-tec-blue/10 text-tec-blue"}`}
                >
                  {amigo.nombreUsuario[0]}
                </div>
                {filtroActivo === "comparar_grupal" && (
                  <button
                    onClick={(e) => toggleSeleccionComparar(e, amigo)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${seleccionados.find((s) => s.id === amigo.id) ? "bg-tec-blue text-white" : "bg-white/5 text-gray-600 hover:text-white"}`}
                  >
                    <UserCheck size={18} />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-black italic uppercase truncate">
                {amigo.nombreUsuario}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1 flex-1">
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

      {/* COMPARADOR GRUPAL FLOTANTE */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[160] w-[95%] max-w-lg bg-card-bg/95 border border-tec-blue/30 backdrop-blur-2xl p-4 rounded-[2rem] shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-3 overflow-hidden">
              {seleccionados.map((s) => (
                <div
                  key={s.id}
                  className="w-8 h-8 rounded-full bg-tec-blue border-2 border-card-bg flex items-center justify-center text-[10px] font-black uppercase"
                >
                  {s.nombreUsuario[0]}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSeleccionados([])}
                className="p-2 bg-white/5 rounded-full text-gray-400"
              >
                <X size={16} />
              </button>
              {seleccionados.length >= 3 && (
                <button
                  onClick={() => setShowComparadorGrupal(true)}
                  className="px-4 py-2 bg-tec-blue text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
                >
                  <Zap size={14} /> Comparar {seleccionados.length}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESULTADOS GRUPALES */}
      {showComparadorGrupal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80">
          <div className="bg-card-bg border border-white/10 p-8 rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black italic uppercase text-tec-blue">
                Huecos en Común
              </h2>
              <button
                onClick={() => setShowComparadorGrupal(false)}
                className="p-4 bg-white/5 rounded-full"
              >
                <X size={24} />
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {huecosGrupales.length === 0 ? (
                <p className="col-span-full text-center py-10 text-gray-500 font-bold italic text-sm">
                  No hay huecos comunes.
                </p>
              ) : (
                huecosGrupales.map((h, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4"
                  >
                    <Coffee className="text-tec-blue" size={20} />
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">
                        {h.dia}
                      </p>
                      <p className="text-lg font-black text-white">
                        {formatearRango(h.rango, formatoHora)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIRECTORIO DE RED */}
      <section className="pt-16 border-t border-white/5 space-y-8 text-center">
        <h2 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.4em]">
          Directorio de Red
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {amigos?.map((amigo) => (
            <div
              key={amigo.id}
              onClick={() => handleFriendClick(amigo)}
              className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center group relative hover:bg-white/10 transition-all shadow-lg cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 font-black mb-2">
                {amigo.nombreUsuario[0]}
              </div>
              <span className="font-bold text-[10px] uppercase truncate w-full text-center">
                {amigo.nombreUsuario}
              </span>
              <div
                className={`absolute -top-2 -right-2 flex flex-col gap-1 transition-all z-10 ${activeOptionsId === amigo.id ? "opacity-100 scale-100" : "opacity-0 scale-95 md:group-hover:opacity-100 md:group-hover:scale-100"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAmigoSeleccionado(amigo);
                    setActiveOptionsId(null);
                  }}
                  className="bg-white text-tec-blue p-2.5 rounded-full shadow-2xl md:hidden hover:scale-110"
                >
                  <Eye size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAmigoParaGrupo(amigo);
                  }}
                  className="bg-purple-600 text-white p-2.5 rounded-full shadow-2xl hover:scale-110"
                >
                  <UserPlus size={12} />
                </button>
                <button
                  onClick={(e) => handleEditar(e, amigo)}
                  className="bg-tec-blue text-white p-2.5 rounded-full shadow-2xl hover:scale-110"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Borrar a ${amigo.nombreUsuario}?`))
                      db.horarios.delete(amigo.id);
                  }}
                  className="bg-red-500 text-white p-2.5 rounded-full shadow-2xl hover:scale-110"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VISOR DE HORARIO OPTIMIZADO */}
      {amigoSeleccionado && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 md:p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setAmigoSeleccionado(null)}
          />
          <div className="relative bg-card-bg w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[3rem] border border-white/10 p-3 md:p-6 no-scrollbar shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center mb-4 md:mb-8 sticky top-0 bg-card-bg/80 backdrop-blur-md py-2 z-10 px-2">
              <div className="flex items-center gap-3 md:gap-6 flex-1 overflow-hidden">
                <h2 className="text-xl md:text-4xl font-black italic uppercase text-tec-blue truncate">
                  {amigoSeleccionado.nombreUsuario}
                </h2>
                <button
                  onClick={descargarCaptura}
                  className="flex items-center gap-2 bg-white text-black px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase hover:bg-tec-blue hover:text-white transition-all shadow-lg shrink-0"
                >
                  <Camera size={14} className="md:w-4 md:h-4" />{" "}
                  <span className="hidden xs:inline">Capturar</span>
                </button>
              </div>
              <button
                onClick={() => setAmigoSeleccionado(null)}
                className="p-2 md:p-4 bg-white/5 rounded-full hover:bg-red-500/10 transition-all ml-2"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </header>

            {/* AJUSTE CLAVE: Movimos el ref screenshotRef directamente al div que tiene el min-width.
                Esto fuerza a la cámara a renderizar el ancho real del horario aunque haya scroll.
            */}
            <div className="bg-card-bg p-1 md:p-4 rounded-3xl overflow-x-auto no-scrollbar">
              <div
                ref={screenshotRef}
                className="min-w-[800px] bg-[#050505] p-6 rounded-2xl flex flex-col gap-6"
              >
                <HorarioGrid horario={amigoSeleccionado} />
                <div className="text-center opacity-20">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">
                    Tec Madero Schedule Network
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
