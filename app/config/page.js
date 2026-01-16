"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { transformarCSV } from "@/lib/parser";
import { FileUp, User, ShieldCheck, AlertCircle, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export default function ConfigPage() {
  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [visible, setVisible] = useState(false); // Controla la opacidad

  const perfilActual = useLiveQuery(() => db.perfil.toCollection().first());

  // Efecto para manejar el desvanecimiento automático
  useEffect(() => {
    if (status.msg) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false); // Inicia el desvanecimiento (opacidad 0)

        // Esperamos a que termine la transición (300ms) para quitar el mensaje del DOM
        setTimeout(() => setStatus({ type: "", msg: "" }), 300);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status.msg]);

  const importarMiHorario = (e) => {
    const file = e.target.files[0];
    const norm = (r) => r.replace(/\s/g, "");

    if (!file || !nombre) {
      setStatus({
        type: "error",
        msg: "Escribe tu nombre antes de subir el archivo.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawData = transformarCSV(event.target.result, nombre);
        const dataLimpia = {
          ...rawData,
          materias: rawData.materias.map((m) => ({
            ...m,
            salon: m.salon.trim().toLowerCase(),
            rangoLink: norm(m.rango),
          })),
        };

        await db.horarios.where({ esPrincipal: "true" }).delete();
        await db.horarios.add({ ...dataLimpia, esPrincipal: "true" });

        await db.perfil.clear();
        await db.perfil.add({
          nombre: nombre,
          id: "usuario_principal",
          actualizado: Date.now(),
        });

        setStatus({
          type: "success",
          msg: "¡Perfil y horario vinculados correctamente!",
        });
      } catch (err) {
        setStatus({ type: "error", msg: err.message });
      } finally {
        e.target.value = ""; // Limpiar el input para permitir reintentos
      }
    };
    reader.readAsText(file);
  };

  const borrarTodo = async () => {
    if (confirm("¿Estás seguro? Se borrarán tus datos y los de tus amigos.")) {
      await db.horarios.clear();
      await db.perfil.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-tec-blue">
          Ajustes
        </h1>
        <p className="text-gray-500 font-medium text-sm">
          Gestiona tu identidad y datos locales.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-card-bg p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 text-tec-blue">
            <User size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">
              Mi Perfil
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                Nombre público
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={perfilActual?.nombre || "Tu nombre completo"}
                className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none focus:border-tec-blue transition-all font-bold text-white"
              />
            </div>

            <label className="flex flex-col items-center justify-center w-full py-12 bg-tec-blue/5 border-2 border-dashed border-tec-blue/20 rounded-[2rem] cursor-pointer hover:bg-tec-blue/10 transition-all group">
              <FileUp
                className="text-tec-blue mb-2 group-hover:scale-110 transition-transform"
                size={32}
              />
              <span className="font-bold text-tec-blue">Subir mi CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importarMiHorario}
                onClick={(e) => (e.target.value = null)}
              />
            </label>
          </div>

          {/* MENSAJE CON DESVANECIMIENTO (TRANSPARENCIA) */}
          {status.msg && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all duration-500 ease-in-out ${
                visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              } ${
                status.type === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-green-500/10 text-green-400 border border-green-500/20"
              }`}
            >
              <AlertCircle size={16} /> {status.msg}
            </div>
          )}
        </section>

        <section className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 flex items-start gap-4">
          <div className="p-3 bg-tec-blue/20 rounded-2xl text-tec-blue">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase">Privacidad ITCM</h3>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-medium">
              Tus datos nunca salen de este navegador.
            </p>
          </div>
        </section>

        <button
          onClick={borrarTodo}
          className="text-red-500/30 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-all py-4"
        >
          Borrar base de datos local
        </button>
      </div>
    </div>
  );
}
