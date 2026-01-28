"use client";
import React, { useState, memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, MoreHorizontal, Star } from "lucide-react";

const norm = (r) => r?.replace(/\s/g, "").toLowerCase() || "";

const MateriaCard = memo(
  ({ materia, amigosAca = [], esVacio, diaContexto, rangoContexto }) => {
    const [activeTooltip, setActiveTooltip] = useState(null);
    const timeoutRef = useRef(null); // Control central de temporizadores

    // Función para manejar la apertura/cierre con inteligencia de colisión
    const handleTooltip = (id, delay = 200) => {
      if (id) {
        // Si entramos a un tooltip, cancelamos cualquier cierre pendiente
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveTooltip(id);
      } else {
        // Si salimos, esperamos un poco antes de cerrar
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setActiveTooltip(null);
        }, delay);
      }
    };

    useEffect(() => {
      const handleScroll = () => setActiveTooltip(null);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
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

        {/* CONTENEDOR DE BURBUJAS */}
        <div className="absolute -bottom-2 -right-2 flex -space-x-2 z-30">
          {amigosPrincipales.map((amigo) => (
            <BurbujaAmigo
              key={amigo.id}
              amigo={amigo}
              materiaRef={materia}
              dia={diaContexto}
              rango={rangoContexto}
              isOpen={activeTooltip === amigo.id}
              onEnter={() => handleTooltip(amigo.id)}
              onLeave={() => handleTooltip(null)}
            />
          ))}

          {amigosExtra.length > 0 && (
            <BurbujaExtra
              amigos={amigosExtra}
              materiaRef={materia}
              dia={diaContexto}
              rango={rangoContexto}
              isOpen={activeTooltip === "extra"}
              onEnter={() => handleTooltip("extra")}
              onLeave={() => handleTooltip(null, 100)} // Tiempo extra para el scroll
            />
          )}
        </div>
      </motion.div>
    );
  },
);

// BURBUJA INDIVIDUAL
const BurbujaAmigo = ({
  amigo,
  materiaRef,
  dia,
  rango,
  isOpen,
  onEnter,
  onLeave,
}) => {
  const suMateria = amigo.materias.find(
    (m) => m.dia === dia && norm(m.rango) === norm(rango),
  );
  const esMismaClase =
    materiaRef && suMateria && norm(suMateria.salon) === norm(materiaRef.salon);

  if (!suMateria) return null;

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {esMismaClase && (
        <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75 pointer-events-none" />
      )}
      <button
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white shadow-xl relative z-10 transition-all ${esMismaClase ? "border-yellow-400 bg-yellow-600 scale-110" : "border-white/20 bg-tec-blue"}`}
      >
        {amigo.nombreUsuario.charAt(0).toUpperCase()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-2 w-52 p-4 bg-[#0a0a0a]/95 border border-white/15 rounded-[1.8rem] shadow-2xl z-[150] backdrop-blur-md pointer-events-auto"
          >
            <div className="absolute top-full left-0 w-full h-4" />
            <div className="flex items-center justify-between mb-1">
              <p
                className={`text-[10px] font-black uppercase tracking-tight ${esMismaClase ? "text-yellow-400" : "text-tec-blue"}`}
              >
                {amigo.nombreUsuario}
              </p>
              {esMismaClase && <Users size={12} className="text-yellow-400" />}
            </div>
            <p className="text-[11px] font-bold text-white leading-tight mb-1">
              {suMateria.nombre}
            </p>
            {suMateria.profesor && (
              <p className="text-[8px] font-bold text-gray-500 uppercase italic truncate mb-2">
                Prof: {suMateria.profesor}
              </p>
            )}
            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <MapPin size={8} /> {suMateria.salon}
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

// BURBUJA EXTRA
const BurbujaExtra = ({
  amigos,
  materiaRef,
  dia,
  rango,
  isOpen,
  onEnter,
  onLeave,
}) => {
  const amigosOrdenados = [...amigos].sort((a, b) => {
    const mA = a.materias.find(
      (mat) => mat.dia === dia && norm(mat.rango) === norm(rango),
    );
    const mB = b.materias.find(
      (mat) => mat.dia === dia && norm(mat.rango) === norm(rango),
    );
    const matchA =
      materiaRef && mA && norm(mA.salon) === norm(materiaRef.salon);
    const matchB =
      materiaRef && mB && norm(mB.salon) === norm(materiaRef.salon);
    return matchA === matchB ? 0 : matchA ? -1 : 1;
  });

  const algunMatch =
    materiaRef &&
    amigos.some((a) => {
      const m = a.materias.find(
        (mat) => mat.dia === dia && norm(mat.rango) === norm(rango),
      );
      return m && norm(m.salon) === norm(materiaRef.salon);
    });

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {algunMatch && (
        <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75 pointer-events-none" />
      )}
      <button
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-white shadow-xl relative z-10 transition-all ${algunMatch ? "border-yellow-400 bg-yellow-600 scale-110" : "border-white/20 bg-gray-800"}`}
      >
        <MoreHorizontal size={12} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-full right-0 p-8 -mr-8 -mb-8 z-[200]"
          >
            <div
              className="w-64 p-4 bg-[#0a0a0a]/98 border border-white/15 rounded-[1.8rem] shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
              onMouseEnter={onEnter}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Network (+{amigos.length})
                </p>
                {algunMatch && (
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <div
                className="space-y-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden"
                onScroll={onEnter}
              >
                {amigosOrdenados.map((a) => {
                  const m = a.materias.find(
                    (mat) => mat.dia === dia && norm(mat.rango) === norm(rango),
                  );
                  if (!m) return null;
                  const match =
                    materiaRef && norm(m.salon) === norm(materiaRef.salon);
                  return (
                    <div
                      key={a.id}
                      className={`group transition-all ${match ? "bg-yellow-400/[0.08] -mx-1 px-2 py-2 rounded-xl border border-yellow-400/10 shadow-[inset_0_0_12px_rgba(250,204,21,0.05)]" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${match ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" : "bg-tec-blue/50"}`}
                          />
                          <span
                            className={`text-[10px] font-black uppercase truncate ${match ? "text-yellow-400" : "text-white/90"}`}
                          >
                            {a.nombreUsuario}
                          </span>
                        </div>
                        {match && (
                          <span className="text-[7px] font-black bg-yellow-400 text-black px-1.5 rounded-full uppercase tracking-tighter">
                            Contigo
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[10px] font-bold leading-tight line-clamp-1 pl-3 ${match ? "text-white" : "text-white/60"}`}
                      >
                        {m.nombre}
                      </p>
                      <div className="flex justify-between items-center mt-1 pl-3 text-[8px] font-mono italic">
                        <span className="text-gray-500 truncate max-w-[110px]">
                          {m.profesor || "N/A"}
                        </span>
                        <span
                          className={
                            match ? "text-yellow-400" : "text-gray-500"
                          }
                        >
                          {m.salon}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

MateriaCard.displayName = "MateriaCard";
export default MateriaCard;
