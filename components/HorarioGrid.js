"use client";
import React, { Fragment } from "react";
import MateriaCard from "./MateriaCard";
import { MapPin } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatearRango } from "@/lib/parser";

export default function HorarioGrid({ horario, compararCon = [] }) {
  // --- CONSULTA DE PREFERENCIAS ---
  const perfil = useLiveQuery(() => db.perfil.toCollection().first());
  const formatoHora = perfil?.formatoHora || 24;

  if (!horario || !horario.materias) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-3xl">
        <p className="text-gray-500">No hay materias registradas.</p>
      </div>
    );
  }

  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  // Consolidamos todas las horas posibles del sistema (manteniendo formato 24h para el sort)
  const todasLasMaterias = [
    ...horario.materias,
    ...compararCon.flatMap((amigo) => amigo.materias),
  ];

  const horasUnicas = [...new Set(todasLasMaterias.map((m) => m.rango))].sort();

  return (
    <div className="overflow-x-auto pb-8 scrollbar-hide">
      <div className="min-w-[850px] grid grid-cols-6 gap-4">
        {/* Encabezados de los Días */}
        <div className="h-12 flex items-center justify-center text-[10px] font-black uppercase text-gray-600 tracking-widest">
          Bloque
        </div>
        {dias.map((dia) => (
          <div
            key={dia}
            className="h-12 flex items-center justify-center text-[10px] font-black uppercase text-tec-blue tracking-[0.2em]"
          >
            {dia}
          </div>
        ))}

        {/* Generación de Filas por Hora */}
        {horasUnicas.map((rango) => (
          <Fragment key={rango}>
            {/* Columna Lateral de Hora (Aquí aplicamos el formato 12/24) */}
            <div className="flex items-center justify-center text-[9px] font-mono font-bold text-gray-400 bg-white/5 rounded-2xl border border-white/5 py-4 shadow-inner px-2 text-center leading-tight">
              {formatearRango(rango, formatoHora)}
            </div>

            {/* Celdas de Materias */}
            {dias.map((dia) => {
              // 1. Tu materia en este bloque
              const miMateria = horario.materias.find(
                (m) => m.dia === dia && m.rango === rango,
              );

              // 2. Amigos que tienen clase en este bloque
              const amigosEnEsteBloque = compararCon.filter((amigo) =>
                amigo.materias.some((m) => m.dia === dia && m.rango === rango),
              );

              return (
                <div
                  key={`${dia}-${rango}`}
                  className="min-h-[110px] relative group"
                >
                  {miMateria ? (
                    <MateriaCard
                      materia={miMateria}
                      amigosAca={amigosEnEsteBloque}
                    />
                  ) : (
                    /* Espacio para Hora Libre */
                    <div className="h-full w-full rounded-2xl border border-dashed border-white/5 flex items-center justify-center bg-white/[0.01] group-hover:bg-white/[0.03] transition-all relative">
                      <span className="text-[9px] text-gray-800 font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity tracking-tighter">
                        Libre
                      </span>

                      {/* BURBUJAS DE AMIGOS */}
                      <div className="absolute -bottom-1 -right-1 flex -space-x-2 p-1">
                        {amigosEnEsteBloque.map((amigo, idx) => {
                          const suMateria = amigo.materias.find(
                            (m) => m.dia === dia && m.rango === rango,
                          );
                          return (
                            <div
                              key={amigo.id}
                              className="relative group/tooltip"
                            >
                              <div
                                className="w-6 h-6 rounded-full border-2 border-dark-bg flex items-center justify-center text-[9px] font-black text-white shadow-lg cursor-help transition-transform hover:scale-125 hover:z-50"
                                style={{
                                  backgroundColor:
                                    idx % 2 === 0 ? "#00529b" : "#8b5cf6",
                                  zIndex: 10 + idx,
                                }}
                              >
                                {amigo.nombreUsuario.charAt(0)}
                              </div>

                              {/* TOOLTIP EMERGENTE */}
                              <div className="absolute bottom-full right-0 mb-2 w-44 p-3 bg-card-bg border border-white/10 rounded-2xl shadow-2xl opacity-0 scale-90 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all z-[100] backdrop-blur-md">
                                <p className="text-[10px] font-black text-accent-purple uppercase tracking-tighter">
                                  {amigo.nombreUsuario}
                                </p>
                                <p className="text-[11px] font-bold text-white mt-1 leading-tight">
                                  {suMateria?.nombre}
                                </p>
                                <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                                  <MapPin size={8} /> {suMateria?.salon}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
