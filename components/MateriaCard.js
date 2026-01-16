"use client";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";

export default function MateriaCard({ materia, amigosAca = [] }) {
  // Función para normalizar y comparar sin espacios
  const norm = (r) => r?.replace(/\s/g, "") || "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full w-full p-4 rounded-[2rem] bg-gradient-to-br from-tec-blue to-accent-purple shadow-lg shadow-blue-900/20 flex flex-col justify-between relative group overflow-visible"
    >
      <h3 className="text-xs font-black leading-tight line-clamp-3 uppercase italic tracking-tighter text-white">
        {materia.nombre}
      </h3>

      <div className="mt-2 flex items-center gap-1 bg-black/20 self-start px-2 py-1 rounded-lg border border-white/10">
        <MapPin size={10} className="text-white/70" />
        <span className="text-[9px] font-black uppercase text-white/90">
          {materia.salon}
        </span>
      </div>

      {/* BURBUJAS DE AMIGOS DENTRO DE TU CLASE */}
      <div className="absolute -bottom-2 -right-2 flex -space-x-2">
        {amigosAca.map((amigo, idx) => {
          const suMateria = amigo.materias.find(
            (m) =>
              m.dia === materia.dia && norm(m.rango) === norm(materia.rango)
          );

          // VALIDACIÓN ROBUSTA: Si el salón y la hora coinciden, están juntos
          // Ignoramos el nombre de la materia por si viene abreviado
          const esMismaClase =
            suMateria &&
            suMateria.salon.trim().toLowerCase() ===
              materia.salon.trim().toLowerCase();

          return (
            <div key={amigo.id} className="relative group/tooltip">
              {/* Efecto de brillo si están en el mismo salón */}
              {esMismaClase && (
                <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75 z-0"></span>
              )}

              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white shadow-xl cursor-help relative z-10 transition-all hover:scale-125 hover:-rotate-12 ${
                  esMismaClase
                    ? "border-yellow-400 bg-yellow-600"
                    : "border-white/20 bg-tec-blue"
                }`}
              >
                {amigo.nombreUsuario.charAt(0).toUpperCase()}
              </div>

              {/* TOOLTIP EMERGENTE */}
              <div className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-card-bg border border-white/10 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.6)] opacity-0 scale-90 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all z-[110] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      esMismaClase ? "text-yellow-400" : "text-tec-blue"
                    }`}
                  >
                    {amigo.nombreUsuario}
                  </p>
                  {esMismaClase && (
                    <Users size={10} className="text-yellow-400" />
                  )}
                </div>
                <p className="text-[11px] font-bold text-white/90 leading-tight">
                  {suMateria?.nombre}
                </p>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <p className="text-[9px] text-gray-400 flex items-center gap-1 font-mono">
                    <MapPin size={8} /> {suMateria?.salon}
                  </p>
                  {esMismaClase && (
                    <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full animate-pulse">
                      JUNTOS
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
