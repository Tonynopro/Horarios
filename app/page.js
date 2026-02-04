"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import HorarioGrid from "@/components/HorarioGrid";
import EditorHorarioManual from "@/components/EditorHorarioManual";
import GuiaCSV from "@/components/GuiaCSV";
import { transformarCSV, obtenerClaseActual } from "@/lib/parser";
import { toPng } from "html-to-image"; // Librería para la exportación
import {
  Users,
  Check,
  Filter,
  FileUp,
  Share2,
  Info,
  ShieldCheck,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Camera,
  Download,
} from "lucide-react";

export default function HomePage() {
  const [amigosActivos, setAmigosActivos] = useState([]);
  const [viewId, setViewId] = useState("principal");
  const [showInfo, setShowInfo] = useState(false);
  const [pasoSeleccion, setPasoSeleccion] = useState(null);
  const [mostrarAvisoOmitir, setMostrarAvisoOmitir] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Estado para la cámara

  // --- CONSULTAS ---
  const miHorario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first(),
  );

  // CAMBIO AQUÍ: Se añade .sortBy("nombreUsuario") para el orden alfabético
  const todosLosAmigos =
    useLiveQuery(() =>
      db.horarios.where({ esPrincipal: "false" }).sortBy("nombreUsuario"),
    ) || [];

  const totalPerfiles = useLiveQuery(() => db.horarios.count()) || 0;
  const perfil = useLiveQuery(() => db.perfil.toCollection().first());

  // --- LÓGICA DE EXPORTACIÓN ---
  const exportarImagen = async () => {
    const node = document.getElementById("horario-completo");
    if (!node) return;

    setIsExporting(true);
    try {
      // Ocultamos temporalmente las flechas de navegación para que no salgan en la foto
      const flechas = document.querySelectorAll(".flecha-nav");
      flechas.forEach((f) => (f.style.opacity = "0"));

      const dataUrl = await toPng(node, {
        backgroundColor: "#0b0b0b", // Fondo oscuro para que combine con el diseño
        pixelRatio: 2, // Doble resolución para que se vea nítido en el cel
        style: {
          borderRadius: "2rem",
        },
      });

      const link = document.createElement("a");
      link.download = `NetworkTec-Horario-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // Devolvemos la visibilidad a las flechas
      flechas.forEach((f) => (f.style.opacity = "1"));
    } catch (err) {
      console.error("Error al exportar:", err);
      alert("Hubo un error al generar la imagen.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- FUNCIONES DE LÓGICA ---
  const toggleAmigo = (id) => {
    setAmigosActivos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const manejarCSV = async (e) => {
    const file = e.target.files[0];
    const nombre = prompt("Ingresa tu nombre:");
    if (!file || !nombre) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = transformarCSV(ev.target.result, nombre);
        await db.horarios.add({ ...data, esPrincipal: "true" });
        await db.perfil.add({
          nombre,
          id: "usuario_principal",
          actualizado: Date.now(),
        });
      } catch (err) {
        alert("Error: Revisa el formato (i).");
      }
    };
    reader.readAsText(file);
  };

  const manejarJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const importados = JSON.parse(ev.target.result);
        const lista = Array.isArray(importados)
          ? importados
          : importados.horarios || [];

        for (const h of lista) {
          if (h.nombreUsuario && h.materias?.length > 0) {
            await db.horarios.put({ ...h, esPrincipal: "false" });
          }
        }
        setPasoSeleccion(lista.filter((h) => h.nombreUsuario));
      } catch (err) {
        alert("Archivo JSON no válido.");
      }
    };
    reader.readAsText(file);
  };

  const autoRegistrarme = async (horario) => {
    await db.horarios.update(horario.id, { esPrincipal: "true" });
    await db.perfil.clear();
    await db.perfil.add({
      nombre: horario.nombreUsuario,
      id: "usuario_principal",
      actualizado: Date.now(),
    });
    setPasoSeleccion(null);
  };

  const guardarDesdeEditor = async (data) => {
    await db.horarios.add({
      ...data,
      esPrincipal: "true",
      id: `me_${Date.now()}`,
    });
    await db.perfil.add({
      nombre: data.nombreUsuario,
      id: "usuario_principal",
      actualizado: Date.now(),
    });
    setShowManual(false);
  };

  // --- PANTALLA DE BIENVENIDA ---
  if (totalPerfiles === 0 || pasoSeleccion || showManual) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 overflow-y-auto">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00529b_1px,transparent_1px)] [background-size:16px_16px]" />

        {showManual ? (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowManual(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full flex justify-center"
            >
              <EditorHorarioManual
                onCancel={() => setShowManual(false)}
                onSave={guardarDesdeEditor}
              />
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-lg bg-card-bg rounded-[2.5rem] border border-white/10 p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            {!pasoSeleccion ? (
              <>
                <header className="text-center mb-10">
                  <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                    NETWORK <span className="text-tec-blue text-2xl">TEC</span>
                  </h1>
                  <p className="text-gray-500 font-bold uppercase text-[8px] tracking-[0.3em] mt-2 italic text-white/40">
                    Setup Wizard
                  </p>
                </header>

                <div className="space-y-4">
                  <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-tec-blue/10 rounded-2xl flex items-center justify-center text-tec-blue shrink-0 group-hover:scale-110 transition-transform">
                      <FileUp size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black uppercase text-white">
                        Configuración Manual
                      </h3>
                      <label className="text-tec-blue text-[10px] font-bold uppercase cursor-pointer hover:underline">
                        Cargar mi horario CSV
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={manejarCSV}
                        />
                      </label>
                    </div>
                  </div>

                  <div
                    onClick={() => setShowManual(true)}
                    className="bg-white/[0.03] p-4 rounded-2xl border border-dashed border-white/10 flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-all group"
                  >
                    <Keyboard
                      size={16}
                      className="text-gray-500 group-hover:text-tec-blue"
                    />
                    <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-white">
                      No tengo archivos, crear a mano
                    </span>
                  </div>

                  <button
                    onClick={() => setShowInfo(true)}
                    className="w-full text-center text-gray-600 hover:text-tec-blue transition-colors text-[9px] font-black uppercase tracking-widest pt-2"
                  >
                    <Info size={14} className="inline mr-1" /> Ver guía de
                    formato
                  </button>

                  <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 flex items-center gap-4 group mt-4">
                    <div className="w-12 h-12 bg-accent-purple/10 rounded-2xl flex items-center justify-center text-accent-purple shrink-0 group-hover:scale-110 transition-transform">
                      <Share2 size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black uppercase text-white">
                        Importar Network
                      </h3>
                      <label className="text-accent-purple text-[10px] font-bold uppercase cursor-pointer hover:underline">
                        Cargar respaldo .JSON
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={manejarJSON}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                {!mostrarAvisoOmitir ? (
                  <>
                    <header className="text-center mb-6">
                      <div className="w-16 h-16 bg-tec-blue/20 rounded-full flex items-center justify-center text-tec-blue mx-auto mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">
                        ¿Quién eres tú?
                      </h2>
                    </header>
                    <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar border-y border-white/5 py-4">
                      {pasoSeleccion.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => autoRegistrarme(h)}
                          className="bg-white/5 hover:bg-tec-blue text-white p-4 rounded-2xl border border-white/5 transition-all font-black text-[10px] uppercase truncate"
                        >
                          {h.nombreUsuario}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setMostrarAvisoOmitir(true)}
                      className="w-full mt-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] hover:text-white transition-colors"
                    >
                      No soy ninguno de esos
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-5 animate-in zoom-in-95">
                    <AlertCircle size={40} className="text-tec-blue mx-auto" />
                    <h3 className="text-lg font-black uppercase text-white">
                      ¡No te preocupes!
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">
                      Puedes entrar y explorar. Luego agrega tus datos en{" "}
                      <span className="text-tec-blue font-bold">
                        Configuracion
                      </span>
                      .
                    </p>
                    <button
                      onClick={() => setPasoSeleccion(null)}
                      className="w-full py-4 bg-tec-blue text-white rounded-2xl font-black uppercase text-xs"
                    >
                      ENTRAR AL DASHBOARD
                    </button>
                  </div>
                )}
              </div>
            )}

            <footer className="mt-8 pt-4 border-t border-white/5 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 text-green-500/80">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    Privacidad Blindada
                  </span>
                </div>
                <p className="text-[8px] text-gray-500 font-medium leading-relaxed uppercase max-w-[250px]">
                  Tus datos se procesan{" "}
                  <span className="text-gray-400">
                    exclusivamente en este dispositivo
                  </span>
                  .
                </p>
              </div>
            </footer>
          </div>
        )}

        {showInfo && <GuiaCSV onClose={() => setShowInfo(false)} />}
      </div>
    );
  }

  // --- DASHBOARD (NORMAL) ---
  const horarioAMostrar =
    viewId === "principal"
      ? miHorario
      : todosLosAmigos?.find((a) => a.id === viewId);

  return (
    /* SE HA AUMENTADO EL MARGEN A pb-44 PARA MÁXIMA COMPATIBILIDAD CON NAVBARS MÓVILES */
    <div className="space-y-6 pb-48 animate-in fade-in max-w-6xl mx-auto px-2 pt-6">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white leading-none">
              Dashboard
            </h1>
            <p className="text-tec-blue text-[10px] font-black tracking-[0.3em] uppercase mt-2">
              Network Tec
            </p>
          </div>
          <div className="flex gap-2">
            {/* BOTÓN DE EXPORTACIÓN */}
            <button
              onClick={exportarImagen}
              disabled={isExporting}
              className={`p-3 bg-white/5 rounded-2xl text-tec-blue hover:bg-tec-blue hover:text-white transition-all border border-white/10 ${isExporting ? "animate-pulse opacity-50" : ""}`}
            >
              {isExporting ? <Download size={20} /> : <Camera size={20} />}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all border border-white/10"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        {/* FILTROS DE COMPARACIÓN */}
        <div className="flex flex-wrap gap-2 p-3 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 px-3 border-r border-white/10">
            <Filter size={12} className="text-gray-500" />
            <span className="text-[10px] font-black uppercase text-gray-500">
              Comparar:
            </span>
          </div>
          {todosLosAmigos?.map((amigo) => (
            <button
              key={amigo.id}
              onClick={() => toggleAmigo(amigo.id)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                amigosActivos.includes(amigo.id)
                  ? "bg-tec-blue border-tec-blue text-white shadow-md shadow-blue-900/40"
                  : "bg-white/5 border-white/5 text-gray-400"
              }`}
            >
              {amigo.nombreUsuario}
            </button>
          ))}
          {todosLosAmigos.length === 0 && (
            <span className="text-[9px] font-bold text-gray-600 uppercase py-1">
              Sin amigos guardados
            </span>
          )}
        </div>
      </header>

      {/* ÁREA DEL GRID - EL WRAPPER TIENE EL ESTILO DEL DASHBOARD */}
      <div className="bg-card-bg/30 rounded-[3rem] border border-white/5 p-2 md:p-6 backdrop-blur-xl overflow-hidden shadow-2xl">
        <HorarioGrid
          horario={horarioAMostrar}
          compararCon={todosLosAmigos?.filter((a) =>
            amigosActivos.includes(a.id),
          )}
        />
      </div>
    </div>
  );
}
