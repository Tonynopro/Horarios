"use client";
import React, { useState, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, MoreHorizontal } from "lucide-react";

const norm = (r) => r?.replace(/\s/g, "") || "";

const MateriaCard = memo(({ materia, amigosAca = [], esVacio }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isTouch, setIsTouch] = useState(false);

  // Detectamos si el usuario está en un dispositivo táctil y cerramos al scrollear
  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);

    const handleScroll = () => setActiveTooltip(null);
    // Escuchamos el scroll en fase de captura para detectar movimiento en el grid
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const maxVisible = 3;
  const amigosPrincipales = amigosAca.slice(0, maxVisible);
  const amigosExtra = amigosAca.slice(maxVisible);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`h-full w-full p-4 rounded-[2rem] flex flex-col justify-between relative ${
        esVacio
          ? "border border-dashed border-white/5 bg-white/[0.01]"
          : "bg-gradient-to-br from-tec-blue to-accent-purple shadow-lg shadow-blue-900/20"
      }`}
    >
      {!esVacio && (
        <>
          <div className="pointer-events-none">
            <h3 className="text-xs font-black leading-tight line-clamp-2 uppercase italic text-white tracking-tighter">
              {materia.nombre}
            </h3>
            {materia.profesor && (
              <p className="text-[8px] font-bold text-white/50 uppercase mt-1 truncate italic tracking-wider">
                {materia.profesor}
              </p>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1 bg-black/20 self-start px-2 py-1 rounded-lg border border-white/10">
            <MapPin size={10} className="text-white/70" />
            <span className="text-[9px] font-black text-white/90 uppercase">
              {materia.salon}
            </span>
          </div>
        </>
      )}

      {/* BURBUJAS */}
      <div className="absolute -bottom-2 -right-2 flex -space-x-2">
        {amigosPrincipales.map((amigo) => (
          <BurbujaAmigo
            key={amigo.id}
            amigo={amigo}
            materiaRef={materia}
            isTouch={isTouch}
            isOpen={activeTooltip === amigo.id}
            setOpen={(val) => setActiveTooltip(val ? amigo.id : null)}
            closeAll={() => setActiveTooltip(null)}
          />
        ))}

        {amigosExtra.length > 0 && (
          <BurbujaExtra
            amigos={amigosExtra}
            materiaRef={materia}
            isTouch={isTouch}
            isOpen={activeTooltip === "extra"}
            setOpen={(val) => setActiveTooltip(val ? "extra" : null)}
            closeAll={() => setActiveTooltip(null)}
          />
        )}
      </div>
    </motion.div>
  );
});

// Burbuja Individual
const BurbujaAmigo = ({
  amigo,
  materiaRef,
  isTouch,
  isOpen,
  setOpen,
  closeAll,
}) => {
  const suMateria = materiaRef
    ? amigo.materias.find(
        (m) =>
          m.dia === materiaRef.dia && norm(m.rango) === norm(materiaRef.rango),
      )
    : amigo.materias[0];

  const esMismaClase =
    materiaRef &&
    suMateria?.salon?.trim().toLowerCase() ===
      materiaRef.salon.trim().toLowerCase();

  return (
    <div
      className="relative"
      onMouseEnter={() => !isTouch && setOpen(true)}
      onMouseLeave={() => !isTouch && setOpen(false)}
    >
      {esMismaClase && (
        <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75 pointer-events-none" />
      )}
      <button
        onClick={(e) => {
          if (isTouch) {
            e.stopPropagation();
            setOpen(!isOpen);
          }
        }}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white shadow-xl relative z-10 transition-all ${
          esMismaClase
            ? "border-yellow-400 bg-yellow-600 scale-110"
            : "border-white/20 bg-tec-blue"
        }`}
      >
        {amigo.nombreUsuario.charAt(0).toUpperCase()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-card-bg/95 border border-white/10 rounded-[1.5rem] shadow-2xl z-[150] backdrop-blur-md pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-1">
              <p
                className={`text-[9px] font-black uppercase ${esMismaClase ? "text-yellow-400" : "text-tec-blue"}`}
              >
                {amigo.nombreUsuario}
              </p>
              {esMismaClase && <Users size={10} className="text-yellow-400" />}
            </div>
            <p className="text-[11px] font-bold text-white leading-tight">
              {suMateria?.nombre}
            </p>
            {suMateria?.profesor && (
              <p className="text-[8px] font-bold text-gray-500 uppercase mt-1 italic">
                Prof: {suMateria.profesor}
              </p>
            )}
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[9px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <MapPin size={8} /> {suMateria?.salon}
              </span>
              {esMismaClase && (
                <span className="text-yellow-400 font-black text-[8px] animate-pulse">
                  JUNTOS
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Burbuja Extra (...)
const BurbujaExtra = ({
  amigos,
  materiaRef,
  isTouch,
  isOpen,
  setOpen,
  closeAll,
}) => {
  const algunMatch =
    materiaRef &&
    amigos.some((a) => {
      const m = a.materias.find(
        (mat) =>
          mat.dia === materiaRef.dia &&
          norm(mat.rango) === norm(materiaRef.rango),
      );
      return (
        m?.salon?.trim().toLowerCase() === materiaRef.salon.trim().toLowerCase()
      );
    });

  return (
    <div
      className="relative"
      onMouseEnter={() => !isTouch && setOpen(true)}
      onMouseLeave={() => !isTouch && setOpen(false)}
    >
      {algunMatch && (
        <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75 pointer-events-none" />
      )}
      <button
        onClick={(e) => {
          if (isTouch) {
            e.stopPropagation();
            setOpen(!isOpen);
          }
        }}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-white shadow-xl relative z-10 transition-all ${
          algunMatch
            ? "border-yellow-400 bg-yellow-600 scale-110"
            : "border-white/20 bg-gray-800"
        }`}
      >
        <MoreHorizontal size={12} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-card-bg/95 border border-white/10 rounded-[1.5rem] shadow-2xl z-[150] backdrop-blur-md"
          >
            <p className="text-[8px] font-black uppercase text-gray-500 mb-2 tracking-widest text-center">
              Lista de Amigos
            </p>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {amigos.map((a) => {
                const m = materiaRef
                  ? a.materias.find(
                      (mat) =>
                        mat.dia === materiaRef.dia &&
                        norm(mat.rango) === norm(materiaRef.rango),
                    )
                  : a.materias[0];
                const match =
                  materiaRef &&
                  m?.salon?.trim().toLowerCase() ===
                    materiaRef.salon.trim().toLowerCase();

                return (
                  <div
                    key={a.id}
                    className="border-b border-white/5 pb-2 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white ${match ? "bg-yellow-600" : "bg-tec-blue"}`}
                      >
                        {a.nombreUsuario.charAt(0)}
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase truncate ${match ? "text-yellow-400" : "text-white"}`}
                      >
                        {a.nombreUsuario}
                      </span>
                      {match && <Users size={8} className="text-yellow-400" />}
                    </div>
                    <p className="text-[10px] font-bold text-white/80 leading-tight line-clamp-1">
                      {m?.nombre}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] text-gray-500 font-mono italic">
                        Prof: {m?.profesor || "N/A"}
                      </span>
                      <span
                        className={`text-[8px] font-mono ${match ? "text-yellow-400" : "text-gray-400"}`}
                      >
                        {m?.salon}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

MateriaCard.displayName = "MateriaCard";
export default MateriaCard;
