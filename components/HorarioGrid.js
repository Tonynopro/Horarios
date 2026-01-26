"use client";
import React, { Fragment, useMemo, useRef, useState } from "react";
import MateriaCard from "./MateriaCard";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatearRango } from "@/lib/parser";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function HorarioGrid({ horario, compararCon = [] }) {
  const scrollRef = useRef(null);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const perfil = useLiveQuery(() => db.perfil.toCollection().first());
  const formatoHora = perfil?.formatoHora || 24;
  const dias = useMemo(
    () => ["lunes", "martes", "miercoles", "jueves", "viernes"],
    [],
  );

  const horasUnicas = useMemo(() => {
    if (!horario?.materias) return [];
    const todas = [
      ...horario.materias,
      ...compararCon.flatMap((a) => a.materias),
    ];
    return [...new Set(todas.map((m) => m.rango))].sort();
  }, [horario, compararCon]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  if (!horario) return null;

  return (
    <div className="w-full relative overflow-hidden">
      {/* FLECHAS FIJAS (GLASS STYLE) */}
      <div className="absolute inset-y-0 left-0 w-0 z-40 md:hidden pointer-events-none">
        {showLeftArrow && (
          <button
            /* AGREGAMOS LA CLASE flecha-nav PARA EL EXPORTADOR */
            className="flecha-nav sticky top-1/2 -translate-y-1/2 ml-2 pointer-events-auto bg-black/60 backdrop-blur-xl p-2 rounded-xl border border-white/10 text-white shadow-2xl animate-in fade-in slide-in-from-left-2"
            onClick={() =>
              scrollRef.current.scrollBy({ left: -200, behavior: "smooth" })
            }
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <div className="absolute inset-y-0 right-0 w-0 z-40 md:hidden pointer-events-none">
        {showRightArrow && (
          <button
            /* AGREGAMOS LA CLASE flecha-nav PARA EL EXPORTADOR */
            className="flecha-nav sticky top-1/2 -translate-y-1/2 -ml-12 mr-2 pointer-events-auto bg-black/60 backdrop-blur-xl p-2 rounded-xl border border-white/10 text-white shadow-2xl animate-in fade-in slide-in-from-right-2"
            onClick={() =>
              scrollRef.current.scrollBy({ left: 200, behavior: "smooth" })
            }
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto pb-8 scrollbar-hide select-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* AGREGAMOS EL ID horario-completo PARA LA CAPTURA DE IMAGEN */}
        <div
          id="horario-completo"
          className="min-w-[850px] grid grid-cols-6 gap-4 px-2"
        >
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

          {horasUnicas.map((rango) => (
            <Fragment key={rango}>
              <div className="flex items-center justify-center text-[9px] font-mono font-bold text-gray-400 bg-white/5 rounded-2xl border border-white/5 py-4 px-2 text-center leading-tight">
                {formatearRango(rango, formatoHora)}
              </div>
              {dias.map((dia) => {
                const miMateria = horario.materias.find(
                  (m) => m.dia === dia && m.rango === rango,
                );
                const amigos = compararCon.filter((a) =>
                  a.materias.some((m) => m.dia === dia && m.rango === rango),
                );
                return (
                  <div
                    key={`${dia}-${rango}`}
                    className="min-h-[110px] relative"
                  >
                    <MateriaCard
                      materia={miMateria}
                      amigosAca={amigos}
                      esVacio={!miMateria}
                    />
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
