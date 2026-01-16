"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import { transformarCSV } from "@/lib/parser";
import { FileUp, User, ShieldCheck, AlertCircle, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

export default function ConfigPage() {
  const [nombre, setNombre] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });

  const miHorario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first()
  );

  const importarMiHorario = (e) => {
    const file = e.target.files[0];
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
        const data = transformarCSV(event.target.result, nombre);

        // Borramos el anterior y guardamos el nuevo como Principal
        await db.horarios.where({ esPrincipal: "true" }).delete();
        await db.horarios.add({ ...data, esPrincipal: "true" });

        setStatus({
          type: "success",
          msg: "Tu horario se ha actualizado correctamente.",
        });
      } catch (err) {
        setStatus({ type: "error", msg: err.message });
      }
    };
    reader.readAsText(file);
  };

  const borrarTodo = async () => {
    if (confirm("¿Estás seguro? Se borrarán tus datos y los de tus amigos.")) {
      await db.horarios.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic tracking-tighter">AJUSTES</h1>
        <p className="text-gray-500 font-medium">
          Configura tu perfil y gestiona tus datos locales.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* MI PERFIL */}
        <section className="bg-card-bg p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-tec-blue">
            <User size={24} />
            <h2 className="text-xl font-bold uppercase tracking-tight">
              Mi Perfil
            </h2>
          </div>

          <div className="space-y-4">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none focus:border-tec-blue transition-all"
            />

            <label className="flex flex-col items-center justify-center w-full py-10 bg-tec-blue/5 border-2 border-dashed border-tec-blue/20 rounded-[2rem] cursor-pointer hover:bg-tec-blue/10 transition-all group">
              <FileUp
                className="text-tec-blue mb-2 group-hover:scale-110 transition-transform"
                size={32}
              />
              <span className="font-bold text-tec-blue">
                Subir mi Horario CSV
              </span>
              <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
                Formato ITCM
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={importarMiHorario}
              />
            </label>
          </div>

          {status.msg && (
            <div
              className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${
                status.type === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              <AlertCircle size={16} /> {status.msg}
            </div>
          )}
        </section>

        {/* INFO DE SEGURIDAD */}
        <section className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-start gap-4">
          <div className="p-3 bg-tec-blue/20 rounded-2xl text-tec-blue">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold">Privacidad Local</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tus datos se guardan solo en este dispositivo. Nada se envía a
              servidores externos.
            </p>
          </div>
        </section>

        <button
          onClick={borrarTodo}
          className="flex items-center justify-center gap-2 text-red-500/50 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors py-4"
        >
          <Trash2 size={14} /> Borrar todos los datos de la app
        </button>
      </div>
    </div>
  );
}
