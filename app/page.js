"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import HorarioGrid from "@/components/HorarioGrid";
import { transformarCSV, obtenerClaseActual } from "@/lib/parser";
import {
  Users,
  Check,
  Filter,
  FileUp,
  Share2,
  Zap,
  Info,
  ShieldCheck,
  X,
  BookMarked,
  RefreshCcw,
  Table as TableIcon,
  FileType,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function HomePage() {
  const [amigosActivos, setAmigosActivos] = useState([]);
  const [viewId, setViewId] = useState("principal");
  const [showInfo, setShowInfo] = useState(false);
  const [pasoSeleccion, setPasoSeleccion] = useState(null); // Para manejar los perfiles del JSON cargado
  const [mostrarAvisoOmitir, setMostrarAvisoOmitir] = useState(false);

  // --- CONSULTAS ---
  const miHorario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first()
  );
  const todosLosAmigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray()
  );
  const totalPerfiles = useLiveQuery(() => db.horarios.count()) || 0;

  // --- FUNCIONES DE LÓGICA ---
  const toggleAmigo = (id) => {
    setAmigosActivos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
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

        // Guardamos todos preventivamente como amigos
        for (const h of lista) {
          if (h.nombreUsuario && h.materias?.length > 0) {
            await db.horarios.put({ ...h, esPrincipal: "false" });
          }
        }
        // Activamos el selector de identidad en la misma pantalla
        setPasoSeleccion(lista.filter((h) => h.nombreUsuario));
      } catch (err) {
        alert("Archivo JSON no válido.");
      }
    };
    reader.readAsText(file);
  };

  const autoRegistrarme = async (horario) => {
    // Marcamos como principal y actualizamos perfil
    await db.horarios.update(horario.id, { esPrincipal: "true" });
    await db.perfil.clear();
    await db.perfil.add({
      nombre: horario.nombreUsuario,
      id: "usuario_principal",
      actualizado: Date.now(),
    });
    setPasoSeleccion(null);
  };

  // --- PANTALLA DE BIENVENIDA ---
  if (totalPerfiles === 0 || pasoSeleccion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 overflow-y-auto">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00529b_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative w-full max-w-lg bg-card-bg rounded-[2.5rem] border border-white/10 p-5 md:p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
          {!pasoSeleccion ? (
            <>
              <header className="text-center mb-6">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
                  NETWORK <span className="text-tec-blue text-2xl">TEC</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase text-[7px] tracking-[0.3em] mt-1 opacity-60">
                  Setup Wizard
                </p>
              </header>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-tec-blue/10 rounded-xl flex items-center justify-center text-tec-blue shrink-0 group-hover:scale-110 transition-transform">
                      <FileUp size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-black uppercase text-white">
                        Configuración Manual
                      </h3>
                      <label className="text-tec-blue text-[9px] font-bold uppercase cursor-pointer hover:underline">
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
                  <button
                    onClick={() => setShowInfo(true)}
                    className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-tec-blue transition-colors text-[8px] font-black uppercase tracking-widest"
                  >
                    <Info size={12} /> Ver guía de formato requerido
                  </button>
                </div>

                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center text-accent-purple shrink-0 group-hover:scale-110 transition-transform">
                    <Share2 size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-black uppercase text-white">
                      Importar Network
                    </h3>
                    <label className="text-accent-purple text-[9px] font-bold uppercase cursor-pointer hover:underline">
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
                    <div className="w-12 h-12 bg-tec-blue/20 rounded-full flex items-center justify-center text-tec-blue mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <h2 className="text-xl font-black uppercase italic text-white tracking-tighter">
                      ¿Quién eres tú?
                    </h2>
                    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest mt-1">
                      Sincronización Exitosa
                    </p>
                  </header>

                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar border-y border-white/5 py-4">
                    {pasoSeleccion.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => autoRegistrarme(h)}
                        className="bg-white/5 hover:bg-tec-blue text-white p-3 rounded-xl border border-white/5 transition-all font-black text-[9px] uppercase truncate"
                      >
                        {h.nombreUsuario}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setMostrarAvisoOmitir(true)}
                    className="w-full mt-4 py-3 bg-white/5 text-gray-500 rounded-xl font-black uppercase text-[9px] hover:text-white transition-colors"
                  >
                    No soy ninguno de esos
                  </button>
                </>
              ) : (
                <div className="text-center space-y-5 animate-in zoom-in-95">
                  <AlertCircle
                    size={40}
                    className="text-tec-blue mx-auto mb-2"
                  />
                  <h3 className="text-lg font-black uppercase text-white">
                    ¡No te preocupes!
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase">
                    Puedes entrar y explorar los horarios de tus amigos. <br />
                    Cuando quieras agregar tu propio horario, ve a la sección de{" "}
                    <span className="text-tec-blue font-bold">
                      Configuracion
                    </span>{" "}
                    en el menú lateral.
                  </p>
                  <button
                    onClick={() => setPasoSeleccion(null)}
                    className="w-full py-4 bg-tec-blue text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all"
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
                Tus datos se procesan y almacenan{" "}
                <span className="text-gray-400">
                  exclusivamente en este dispositivo
                </span>
                .
              </p>
            </div>
          </footer>
        </div>

        {/* MODAL INFO */}
        {showInfo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in">
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowInfo(false)}
            />
            <div className="relative bg-card-bg w-full max-w-3xl rounded-[3rem] border border-white/10 p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6 text-tec-blue">
                <div className="flex items-center gap-2">
                  <Info size={20} />
                  <h3 className="text-lg font-black uppercase italic">
                    Guía de Formato CSV
                  </h3>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-2 bg-white/5 rounded-full text-white hover:rotate-90 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <TableIcon size={14} /> Formato de Celdas (Excel)
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02]">
                    <table className="w-full text-left text-[8px] font-bold min-w-[600px]">
                      <thead className="bg-tec-blue/10 text-tec-blue uppercase text-center">
                        <tr>
                          <th className="p-3 border-r border-white/5">Hora</th>
                          <th className="p-3 border-r border-white/5">Lunes</th>
                          <th className="p-3 border-r border-white/5">
                            Martes
                          </th>
                          <th className="p-3 border-r border-white/5">
                            Miércoles
                          </th>
                          <th className="p-3 border-r border-white/5">
                            Jueves
                          </th>
                          <th className="p-3">Viernes</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 text-center">
                        <tr>
                          <td className="p-3 border-b border-white/5 bg-white/5 italic font-mono">
                            08:00-09:00
                          </td>
                          <td className="p-3 border-b border-r border-white/5">
                            IA (LCA)
                          </td>
                          <td className="p-3 border-b border-r border-white/5">
                            IA (LCA)
                          </td>
                          <td className="p-3 border-b border-r border-white/5">
                            IA (LCA)
                          </td>
                          <td className="p-3 border-b border-r border-white/5">
                            IA (FF6)
                          </td>
                          <td className="p-3 border-b border-white/5 text-gray-600"></td>
                        </tr>
                        <tr>
                          <td className="p-3 border-b border-white/5 bg-white/5 italic font-mono">
                            09:00-10:00
                          </td>
                          <td className="p-3 border-b border-r border-white/5 text-gray-600">
                            ---
                          </td>
                          <td className="p-3 border-b border-r border-white/5">
                            Cálculo (FF6)
                          </td>
                          <td className="p-3 border-b border-r border-white/5 text-gray-600"></td>
                          <td className="p-3 border-b border-r border-white/5">
                            Cálculo (FF6)
                          </td>
                          <td className="p-3 border-b border-white/5">
                            Cálculo (FF6)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    <FileType size={14} /> Ejemplo en Texto Plano (CSV)
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl font-mono text-[9px] text-tec-blue leading-relaxed border border-white/5 overflow-x-auto">
                    Hora,Lunes,Martes,Miércoles,Jueves,Viernes
                    <br />
                    08:00 - 09:00,IA (LCA),IA (LCA),IA (LCA),IA (FF6)
                    <br />
                    09:00 - 10:00,Cálculo (FF6),,Cálculo (FF6),Cálculo (FF6)
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 text-center font-bold uppercase italic border-t border-white/5 pt-4">
                  Importante: El salón debe estar encerrado entre{" "}
                  <span className="text-white">paréntesis ( )</span>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DASHBOARD (NORMAL) ---
  const horarioAMostrar =
    viewId === "principal"
      ? miHorario
      : todosLosAmigos?.find((a) => a.id === viewId);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in max-w-6xl mx-auto px-2">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-white">
            Dashboard
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 px-2 border-r border-white/10">
            <Filter size={10} className="text-gray-500" />
            <span className="text-[8px] font-black uppercase text-gray-500">
              Comparar:
            </span>
          </div>
          {todosLosAmigos?.map((amigo) => (
            <button
              key={amigo.id}
              onClick={() => toggleAmigo(amigo.id)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all flex items-center gap-1.5 ${
                amigosActivos.includes(amigo.id)
                  ? "bg-tec-blue text-white shadow-md"
                  : "bg-white/5 text-gray-400 border border-white/5"
              }`}
            >
              {amigosActivos.includes(amigo.id) && <Check size={10} />}
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

      <div className="bg-card-bg/30 rounded-[2.5rem] border border-white/5 p-3 md:p-6 backdrop-blur-xl overflow-hidden shadow-2xl">
        <HorarioGrid
          horario={horarioAMostrar}
          compararCon={todosLosAmigos?.filter((a) =>
            amigosActivos.includes(a.id)
          )}
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-tec-blue/10 rounded-[2rem] border border-tec-blue/20">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-tec-blue mb-3 flex items-center gap-2">
            <Users size={12} /> Coincidencias Ahora
          </h3>
          <div className="flex flex-wrap gap-2">
            {todosLosAmigos?.map((amigo) => {
              const miClase = obtenerClaseActual(miHorario?.materias);
              const suClase = obtenerClaseActual(amigo.materias);
              if (miClase && suClase && miClase.rango === suClase.rango) {
                return (
                  <span
                    key={amigo.id}
                    className="bg-tec-blue text-white px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-sm uppercase"
                  >
                    {amigo.nombreUsuario}
                  </span>
                );
              }
              return null;
            })}
            {(!miHorario || todosLosAmigos.length === 0) && (
              <span className="text-[9px] text-gray-600 font-bold uppercase italic">
                Buscando coincidencias...
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
