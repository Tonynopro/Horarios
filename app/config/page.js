"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { transformarCSV } from "@/lib/parser";
import EditorHorarioManual from "@/components/EditorHorarioManual";
import {
  FileUp,
  User,
  Trash2,
  Download,
  Share2,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  RefreshCcw,
  BookMarked,
  Info,
  Table as TableIcon,
  FileType,
  Keyboard,
  AlertCircle,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export default function ConfigPage() {
  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [visible, setVisible] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const [pendientesConfig, setPendientesConfig] = useState([]);
  const [mostrarExportModal, setMostrarExportModal] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const topRef = useRef(null);

  const perfilActual = useLiveQuery(() => db.perfil.toCollection().first());
  const todosLosHorariosRaw = useLiveQuery(() => db.horarios.toArray());

  const todosLosHorarios = (todosLosHorariosRaw || []).filter(
    (h) =>
      h &&
      h.id &&
      h.nombreUsuario &&
      Array.isArray(h.materias) &&
      h.materias.length > 0
  );

  useEffect(() => {
    if (status.msg) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setStatus({ type: "", msg: "" }), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status.msg]);

  const borrarTodo = async () => {
    if (confirm("¿Estás seguro? Esto eliminará físicamente TODOS los datos.")) {
      try {
        await Promise.all([db.horarios.clear(), db.perfil.clear()]);
        setStatus({ type: "success", msg: "Base de datos purgada." });
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        setStatus({ type: "error", msg: "Error al limpiar: " + err.message });
      }
    }
  };

  const abrirExportar = () => {
    if (todosLosHorarios.length === 0) {
      setStatus({ type: "error", msg: "No hay horarios válidos." });
      return;
    }
    setSeleccionados(todosLosHorarios.map((h) => h.id));
    setMostrarExportModal(true);
  };

  // --- FUNCIÓN RESTAURADA ---
  const confirmarExportar = () => {
    const dataAExportar = todosLosHorarios
      .filter((h) => seleccionados.includes(h.id))
      .map((h) => ({ ...h, esPrincipal: "false" }));

    const dataStr = JSON.stringify(dataAExportar);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `Export_Network_${Date.now()}.json`);
    link.click();
    setMostrarExportModal(false);
    setStatus({
      type: "success",
      msg: `Exportados ${dataAExportar.length} perfiles.`,
    });
  };

  const importarNetworkJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importados = JSON.parse(event.target.result);
        const lista = Array.isArray(importados)
          ? importados
          : importados.horarios || [];
        for (const h of lista) {
          if (h && h.nombreUsuario && h.materias?.length > 0) {
            await db.horarios.put({ ...h, esPrincipal: "false" });
          }
        }
        setPendientesConfig(lista.filter((h) => h.nombreUsuario));
        setStatus({ type: "success", msg: "Datos sincronizados." });
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        setStatus({ type: "error", msg: "Archivo incompatible." });
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const guardarDesdeEditor = async (data) => {
    try {
      await db.horarios.where({ esPrincipal: "true" }).delete();
      await db.horarios.add({
        ...data,
        esPrincipal: "true",
        id: `me_${Date.now()}`,
      });
      await db.perfil.clear();
      await db.perfil.add({
        nombre: data.nombreUsuario,
        id: "usuario_principal",
        actualizado: Date.now(),
      });
      setShowManual(false);
      setStatus({ type: "success", msg: "Perfil actualizado." });
    } catch (err) {
      setStatus({ type: "error", msg: "Error al guardar." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-48 px-4 md:px-0 animate-in fade-in duration-500 relative">
      <div ref={topRef} className="absolute -top-20" />

      {showManual && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowManual(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EditorHorarioManual
              nombreInicial={perfilActual?.nombre || ""}
              onCancel={() => setShowManual(false)}
              onSave={guardarDesdeEditor}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setShowInfoModal(true)}
        className="fixed bottom-24 right-8 z-50 p-4 bg-tec-blue text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <Info size={24} />
      </button>

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
            Ajustes <span className="text-tec-blue">Network</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">
            Database Control
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-500 transition-all"
        >
          <RefreshCcw size={20} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Identidad */}
        {pendientesConfig.length > 0 && (
          <section className="bg-tec-blue p-8 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-black uppercase text-white mb-4 flex items-center gap-2">
              <CheckCircle2 /> ¿Cuál eres tú?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pendientesConfig.map((h) => (
                <button
                  key={h.id}
                  onClick={async () => {
                    await db.horarios
                      .where({ esPrincipal: "true" })
                      .modify({ esPrincipal: "false" });
                    await db.horarios.update(h.id, { esPrincipal: "true" });
                    await db.perfil.clear();
                    await db.perfil.add({
                      nombre: h.nombreUsuario,
                      id: "usuario_principal",
                      actualizado: Date.now(),
                    });
                    setPendientesConfig([]);
                    setStatus({
                      type: "success",
                      msg: `Perfil: ${h.nombreUsuario}`,
                    });
                  }}
                  className="bg-white/10 hover:bg-white text-white hover:text-tec-blue p-4 rounded-2xl transition-all font-black text-[10px] uppercase truncate shadow-md"
                >
                  {h.nombreUsuario}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Perfil */}
        <section className="bg-card-bg p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 text-tec-blue mb-6">
            <User size={24} />{" "}
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Mi Perfil
            </h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 ml-2 mb-2 tracking-widest">
                Nombre de Usuario
              </p>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={perfilActual?.nombre || "Tu nombre..."}
                className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none focus:border-tec-blue font-bold text-white shadow-inner"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowManual(true)}
                className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left"
              >
                <Keyboard size={24} className="text-tec-blue" />
                <div>
                  <p className="font-black text-sm uppercase text-white">
                    Editar a mano
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase font-bold">
                    Manual
                  </p>
                </div>
              </button>
              <label className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                <FileUp size={24} className="text-tec-blue" />
                <div>
                  <p className="font-black text-sm uppercase text-white">
                    Subir CSV
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase font-bold">
                    Archivo
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const data = transformarCSV(
                          ev.target.result,
                          nombre || perfilActual?.nombre
                        );
                        await db.horarios
                          .where({ esPrincipal: "true" })
                          .delete();
                        await db.horarios.add({ ...data, esPrincipal: "true" });
                        await db.perfil.clear();
                        await db.perfil.add({
                          nombre: nombre || perfilActual?.nombre,
                          id: "usuario_principal",
                          actualizado: Date.now(),
                        });
                        setStatus({
                          type: "success",
                          msg: "¡Perfil actualizado!",
                        });
                      } catch (err) {
                        setStatus({ type: "error", msg: "Error de formato." });
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        </section>

        {/* Datos */}
        <section className="bg-card-bg p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 text-accent-purple mb-6 text-xl font-black uppercase tracking-tight text-white">
            <Share2 size={24} /> Respaldo
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={abrirExportar}
              className="flex flex-col items-center justify-center gap-3 bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all shadow-inner"
            >
              <Download size={32} className="text-accent-purple" />
              <p className="font-black text-xs uppercase text-white">
                Exportar JSON
              </p>
            </button>
            <label className="flex flex-col items-center justify-center gap-3 bg-accent-purple/10 border border-accent-purple/20 p-8 rounded-3xl cursor-pointer hover:bg-accent-purple/20 transition-all">
              <FileUp size={32} className="text-accent-purple" />
              <p className="font-black text-xs uppercase text-white">
                Importar JSON
              </p>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={importarNetworkJSON}
              />
            </label>
          </div>
        </section>

        {status.msg && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all duration-500 ${
              visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } ${
              status.type === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            <AlertCircle size={16} /> {status.msg}
          </div>
        )}

        {/* PURGAR */}
        <button
          onClick={borrarTodo}
          className="text-red-500/20 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all py-8 flex items-center justify-center gap-2"
        >
          <Trash2 size={14} /> Purgar sistema completo
        </button>
      </div>

      {/* MODAL INFO */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="relative bg-card-bg w-full max-w-4xl rounded-[3rem] border border-white/10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3 text-tec-blue">
                <Info size={28} />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  Guía de Formato
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-3 bg-white/5 rounded-full hover:rotate-90 transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
                <TableIcon size={14} /> Vista Excel
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02]">
                <table className="w-full text-left text-[9px] font-bold min-w-[700px] text-center">
                  <thead className="bg-tec-blue/10 text-tec-blue uppercase text-white font-black">
                    <tr>
                      <th className="p-3 border-r border-white/5">Hora</th>
                      <th className="p-3 border-r border-white/5">Lunes</th>
                      <th className="p-3 border-r border-white/5">Martes</th>
                      <th className="p-3 border-r border-white/5">Miércoles</th>
                      <th className="p-3 border-r border-white/5">Jueves</th>
                      <th className="p-3">Viernes</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr>
                      <td className="p-3 border-b border-white/5 bg-white/5 italic font-mono whitespace-nowrap">
                        08:00 - 09:00
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
                        IA (LCA)
                      </td>
                      <td className="p-3 border-b border-white/5 text-gray-700">
                        ---
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                * Formato:{" "}
                <span className="text-white font-bold">Materia (Salón)</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Exportar */}
      {mostrarExportModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
          onClick={() => setMostrarExportModal(false)}
        >
          <div
            className="relative bg-card-bg w-full max-w-lg rounded-[3rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 text-white font-black uppercase italic">
              <h3>Seleccionar Perfiles</h3>
              <button onClick={() => setMostrarExportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 no-scrollbar">
              {todosLosHorarios.map((h) => (
                <div
                  key={h.id}
                  onClick={() =>
                    setSeleccionados((prev) =>
                      prev.includes(h.id)
                        ? prev.filter((i) => i !== h.id)
                        : [...prev, h.id]
                    )
                  }
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    seleccionados.includes(h.id)
                      ? "bg-tec-blue/20 border-tec-blue text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                  }`}
                >
                  <span className="font-black text-xs uppercase truncate max-w-[150px]">
                    {h.nombreUsuario}
                  </span>
                  {seleccionados.includes(h.id) ? (
                    <CheckSquare size={18} className="text-tec-blue" />
                  ) : (
                    <Square size={18} />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={confirmarExportar}
              disabled={seleccionados.length === 0}
              className="w-full mt-6 bg-tec-blue p-4 rounded-xl font-black uppercase text-xs text-white"
            >
              Descargar JSON ({seleccionados.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
