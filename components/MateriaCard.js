"use client";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";

export default function MateriaCard({ materia, amigosAca = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full w-full p-4 rounded-2xl bg-gradient-to-br from-tec-blue to-accent-purple shadow-lg shadow-blue-900/20 flex flex-col justify-between relative group"
    >
      <h3 className="text-sm font-bold leading-tight line-clamp-2 uppercase italic tracking-tighter">
        {materia.nombre}
      </h3>

      <div className="mt-2 flex items-center gap-1 bg-black/20 self-start px-2 py-1 rounded-lg border border-white/5">
        <MapPin size={10} className="text-white/70" />
        <span className="text-[10px] font-black uppercase">
          {materia.salon}
        </span>
      </div>

      {/* BURBUJAS DE AMIGOS DENTRO DE TU CLASE */}
      <div className="absolute -bottom-2 -right-2 flex -space-x-2">
        {amigosAca.map((amigo, idx) => {
          const suMateria = amigo.materias.find(
            (m) => m.dia === materia.dia && m.rango === materia.rango
          );

          // VALIDACIÓN DE "MISMA CLASE EXACTA"
          const esMismaClase =
            suMateria?.nombre.toLowerCase() === materia.nombre.toLowerCase() &&
            suMateria?.salon === materia.salon;

          return (
            <div key={amigo.id} className="relative group/tooltip">
              {/* Efecto de brillo si es la misma clase */}
              {esMismaClase && (
                <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></span>
              )}

              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white shadow-xl cursor-help relative z-10 transition-transform hover:scale-125 ${
                  esMismaClase
                    ? "border-yellow-400 bg-yellow-600"
                    : "border-dark-bg bg-tec-blue"
                }`}
              >
                {amigo.nombreUsuario[0]}
              </div>

              {/* TOOLTIP */}
              <div className="absolute bottom-full right-0 mb-2 w-44 p-3 bg-card-bg border border-white/10 rounded-2xl shadow-2xl opacity-0 scale-90 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all z-[100]">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={`text-[10px] font-black uppercase ${
                      esMismaClase ? "text-yellow-400" : "text-tec-blue"
                    }`}
                  >
                    {amigo.nombreUsuario}
                  </p>
                  {esMismaClase && (
                    <Users size={10} className="text-yellow-400" />
                  )}
                </div>
                <p className="text-[11px] font-bold text-white leading-tight">
                  {suMateria?.nombre}
                </p>
                <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1 font-mono">
                  <MapPin size={8} /> {suMateria?.salon}
                </p>
                {esMismaClase && (
                  <p className="text-[8px] mt-2 font-black text-yellow-400/80 uppercase tracking-widest border-t border-white/5 pt-2">
                    ¡Están juntos aquí!
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
