"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import HorarioGrid from "@/components/HorarioGrid";
import { obtenerClaseActual } from "@/lib/parser";
import { Users, User, Check, Filter } from "lucide-react";

export default function HomePage() {
  const [amigosActivos, setAmigosActivos] = useState([]); // IDs de amigos seleccionados
  const [viewId, setViewId] = useState("principal");

  const miHorario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first()
  );
  const todosLosAmigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray()
  );

  const horarioAMostrar =
    viewId === "principal"
      ? miHorario
      : todosLosAmigos?.find((a) => a.id === viewId);

  const toggleAmigo = (id) => {
    setAmigosActivos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase">
          Dashboard
        </h1>

        {/* FILTROS DE VISIBILIDAD DE AMIGOS */}
        <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-3xl border border-white/10">
          <div className="flex items-center gap-2 mr-4 px-2 border-r border-white/10">
            <Filter size={14} className="text-gray-500" />
            <span className="text-[10px] font-bold uppercase text-gray-500">
              Comparar:
            </span>
          </div>
          {todosLosAmigos?.map((amigo) => (
            <button
              key={amigo.id}
              onClick={() => toggleAmigo(amigo.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                amigosActivos.includes(amigo.id)
                  ? "bg-tec-blue text-white shadow-lg"
                  : "bg-white/5 text-gray-400 border border-white/5"
              }`}
            >
              {amigosActivos.includes(amigo.id) && <Check size={12} />}
              {amigo.nombreUsuario}
            </button>
          ))}
        </div>
      </header>

      {/* GRID PRINCIPAL */}
      <div className="bg-card-bg/30 rounded-[3rem] border border-white/5 p-4 md:p-8 backdrop-blur-xl">
        <HorarioGrid
          horario={horarioAMostrar}
          compararCon={todosLosAmigos?.filter((a) =>
            amigosActivos.includes(a.id)
          )}
        />
      </div>

      {/* PANEL DE COINCIDENCIAS RÁPIDAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-tec-blue/10 rounded-3xl border border-tec-blue/20">
          <h3 className="text-xs font-black uppercase tracking-widest text-tec-blue mb-4">
            Comparten mi clase ahora
          </h3>
          <div className="flex flex-wrap gap-2">
            {todosLosAmigos?.map((amigo) => {
              const miClase = obtenerClaseActual(miHorario?.materias);
              const suClase = obtenerClaseActual(amigo.materias);
              if (miClase && suClase && miClase.rango === suClase.rango) {
                return (
                  <span
                    key={amigo.id}
                    className="bg-tec-blue px-3 py-1 rounded-full text-[10px] font-bold"
                  >
                    {amigo.nombreUsuario}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
