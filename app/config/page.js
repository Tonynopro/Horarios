"use client";
import { useState, useEffect, useRef, Suspense } from "react"; // 1. Añadimos Suspense a los imports
import { db } from "@/lib/db";
import { transformarCSV } from "@/lib/parser";
import EditorHorarioManual from "@/components/EditorHorarioManual";
import GuiaCSV from "@/components/GuiaCSV";
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
  Info,
  AlertCircle,
  Clock,
  Edit3,
  FileCode,
  Users,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";

// 2. Extraemos el contenido original a un componente interno
function ConfigContent() {
  const searchParams = useSearchParams();
  const isFdoSuccess = searchParams.get("status") === "fdo_success";

  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [visible, setVisible] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showVinculaModal, setShowVinculaModal] = useState(false);

  const [pendientesConfig, setPendientesConfig] = useState([]);
  const [mostrarExportModal, setMostrarExportModal] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const topRef = useRef(null);

  const perfilActual = useLiveQuery(() => db.perfil.toCollection().first());
  const miHorarioActual = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first(),
  );
  const todosLosHorariosRaw = useLiveQuery(() => db.horarios.toArray());

  const misAmigos = (todosLosHorariosRaw || []).filter(
    (h) => h.esPrincipal === "false",
  );

  const todosLosHorarios = (todosLosHorariosRaw || []).filter(
    (h) =>
      h &&
      h.id &&
      h.nombreUsuario &&
      Array.isArray(h.materias) &&
      h.materias.length > 0,
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

  const establecerComoYo = async (amigo) => {
    try {
      await db.horarios
        .where({ esPrincipal: "true" })
        .modify({ esPrincipal: "false" });
      await db.horarios.update(amigo.id, { esPrincipal: "true" });
      const currentFormat = perfilActual?.formatoHora || 24;
      await db.perfil.clear();
      await db.perfil.add({
        nombre: amigo.nombreUsuario,
        id: "usuario_principal",
        updatedAt: Date.now(),
        formatoHora: currentFormat,
      });
      setShowVinculaModal(false);
      setStatus({
        type: "success",
        msg: `Perfil vinculado: ${amigo.nombreUsuario}`,
      });
    } catch (err) {
      setStatus({ type: "error", msg: "Error al vincular perfil." });
    }
  };

  const cambiarFormatoHora = async (formato) => {
    if (!perfilActual) return;
    try {
      await db.perfil.update(perfilActual.id, { formatoHora: formato });
      setStatus({ type: "success", msg: `Formato cambiado a ${formato}h` });
    } catch (err) {
      setStatus({ type: "error", msg: "Error al cambiar formato" });
    }
  };

  const borrarTodo = async () => {
    if (confirm("¿Estás seguro? Esto eliminará físicamente TODOS los datos.")) {
      try {
        await Promise.all([db.horarios.clear(), db.perfil.clear()]);
        setStatus({ type: "success", msg: "Base de datos purgada." });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
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

  const ejecutarExportacionFdo = () => {
    const dataAExportar = todosLosHorarios
      .filter((h) => seleccionados.includes(h.id))
      .map((h) => ({ ...h, esPrincipal: "false" }));

    const dataStr = JSON.stringify(dataAExportar);
    const blob = new Blob([dataStr], { type: "application/x-fdo" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Network_${Date.now()}.fdo`;
    link.click();

    URL.revokeObjectURL(url);
    setMostrarExportModal(false);
    setStatus({
      type: "success",
      msg: `Exportados ${dataAExportar.length} perfiles (.fdo).`,
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
        const datosAInsertar = lista
          .filter((h) => h && h.nombreUsuario && h.materias?.length > 0)
          .map((h) => ({ ...h, esPrincipal: "false" }));

        if (datosAInsertar.length > 0) {
          await db.horarios.bulkPut(datosAInsertar);
        }

        setPendientesConfig(datosAInsertar);
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
      const currentFormat = perfilActual?.formatoHora || 24;
      await db.perfil.clear();
      await db.perfil.add({
        nombre: data.nombreUsuario,
        id: "usuario_principal",
        updatedAt: Date.now(),
        formatoHora: currentFormat,
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

      {/* MODALES */}
      {showManual && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowManual(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EditorHorarioManual
              key={miHorarioActual?.id || "nuevo_propio"}
              nombreInicial={perfilActual?.nombre || ""}
              materiasIniciales={miHorarioActual?.materias || []}
              onCancel={() => setShowManual(false)}
              onSave={guardarDesdeEditor}
            />
          </div>
        </div>
      )}

      {showVinculaModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setShowVinculaModal(false)}
        >
          <div
            className="bg-card-bg w-full max-w-md rounded-[3rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 text-white font-black uppercase italic">
              <h3>Elegir de Amigos</h3>
              <button onClick={() => setShowVinculaModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {misAmigos.length === 0 ? (
                <p className="text-gray-500 text-center py-10 font-bold uppercase text-[10px]">
                  No tienes amigos agregados
                </p>
              ) : (
                misAmigos.map((amigo) => (
                  <button
                    key={amigo.id}
                    onClick={() => establecerComoYo(amigo)}
                    className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-tec-blue hover:text-white transition-all group"
                  >
                    <span className="font-black text-xs uppercase">
                      {amigo.nombreUsuario}
                    </span>
                    <CheckCircle2
                      size={16}
                      className="opacity-0 group-hover:opacity-100"
                    />
                  </button>
                ))
              )}
            </div>
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
        {pendientesConfig.length > 0 && (
          <section className="bg-tec-blue p-8 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-black uppercase text-white mb-4 flex items-center gap-2">
              <CheckCircle2 /> ¿Cuál eres tú?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pendientesConfig.map((h) => (
                <button
                  key={h.id}
                  onClick={() => establecerComoYo(h)}
                  className="bg-white/10 hover:bg-white text-white hover:text-tec-blue p-4 rounded-2xl transition-all font-black text-[10px] uppercase truncate shadow-md"
                >
                  {h.nombreUsuario}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="bg-card-bg p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 text-tec-blue mb-6">
            <User size={24} />
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

            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 ml-2 mb-2 tracking-widest flex items-center gap-2">
                <Clock size={12} /> Visualización de Tiempo
              </p>
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {[12, 24].map((f) => (
                  <button
                    key={f}
                    onClick={() => cambiarFormatoHora(f)}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
                      (perfilActual?.formatoHora || 24) === f
                        ? "bg-tec-blue text-white shadow-lg scale-[1.02]"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    {f} Horas
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowManual(true)}
                className="flex items-center gap-4 p-5 bg-tec-blue/10 border border-tec-blue/20 rounded-2xl hover:bg-tec-blue/20 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-tec-blue/20 rounded-xl flex items-center justify-center text-tec-blue group-hover:scale-110 transition-transform">
                  <Edit3 size={20} />
                </div>
                <div>
                  <p className="font-black text-[11px] uppercase text-white">
                    Editar Manual
                  </p>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">
                    Modificar materias
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowVinculaModal(true)}
                className={`flex items-center gap-4 p-5 border rounded-2xl transition-all text-left group relative overflow-hidden ${
                  isFdoSuccess
                    ? "bg-tec-blue/30 border-tec-blue shadow-[0_0_20px_rgba(0,112,243,0.3)] animate-pulse"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isFdoSuccess ? "bg-tec-blue text-white" : "bg-white/10 text-white"}`}
                >
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-black text-[11px] uppercase text-white">
                    Elegir de Amigos
                  </p>
                  <p
                    className={`text-[8px] uppercase font-bold ${isFdoSuccess ? "text-tec-blue" : "text-gray-500"}`}
                  >
                    {isFdoSuccess ? "¡Archivo cargado!" : "Promover perfil"}
                  </p>
                </div>
                {isFdoSuccess && (
                  <div className="absolute top-0 right-0 p-1">
                    <div className="w-2 h-2 bg-tec-blue rounded-full animate-ping"></div>
                  </div>
                )}
              </button>

              <label className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-tec-blue">
                  <FileUp size={20} />
                </div>
                <div>
                  <p className="font-black text-[11px] uppercase text-white">
                    Subir nuevo CSV
                  </p>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">
                    Reemplazar actual
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
                          nombre || perfilActual?.nombre,
                        );
                        await db.horarios
                          .where({ esPrincipal: "true" })
                          .delete();
                        await db.horarios.add({ ...data, esPrincipal: "true" });
                        const currentFormat = perfilActual?.formatoHora || 24;
                        await db.perfil.clear();
                        await db.perfil.add({
                          nombre: nombre || perfilActual?.nombre,
                          id: "usuario_principal",
                          actualizado: Date.now(),
                          formatoHora: currentFormat,
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
                Exportar Datos
              </p>
            </button>
            <label className="flex flex-col items-center justify-center gap-3 bg-accent-purple/10 border border-accent-purple/20 p-8 rounded-3xl cursor-pointer hover:bg-accent-purple/20 transition-all">
              <FileUp size={32} className="text-accent-purple" />
              <p className="font-black text-xs uppercase text-white">
                Importar .json o .fdo
              </p>
              <input
                type="file"
                accept=".json,.fdo"
                className="hidden"
                onChange={importarNetworkJSON}
              />
            </label>
          </div>
        </section>

        {status.msg && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all duration-500 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"} ${status.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}
          >
            <AlertCircle size={16} /> {status.msg}
          </div>
        )}

        <button
          onClick={borrarTodo}
          className="text-red-500/20 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all py-8 flex items-center justify-center gap-2"
        >
          <Trash2 size={14} /> Purgar sistema completo
        </button>
      </div>

      {showInfoModal && <GuiaCSV onClose={() => setShowInfoModal(false)} />}

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
                        : [...prev, h.id],
                    )
                  }
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${seleccionados.includes(h.id) ? "bg-tec-blue/20 border-tec-blue text-white shadow-lg" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"}`}
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
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={ejecutarExportacionFdo}
                disabled={seleccionados.length === 0}
                className="bg-tec-blue p-4 rounded-xl font-black uppercase text-[10px] text-white flex flex-col items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                <FileCode size={20} /> Descargar .fdo
              </button>
              <button
                onClick={confirmarExportar}
                disabled={seleccionados.length === 0}
                className="bg-white/10 p-4 rounded-xl font-black uppercase text-[10px] text-white flex flex-col items-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <Download size={20} /> Descargar .json
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. El componente que exportamos envuelve todo en Suspense
export default function ConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="text-white p-10 font-black uppercase">
          Cargando Ajustes...
        </div>
      }
    >
      <ConfigContent />
    </Suspense>
  );
}
