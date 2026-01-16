"use client";
import { Home, Users, Settings, Clock, User, Zap, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { obtenerClaseActual } from "@/lib/parser";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [ahora, setAhora] = useState(new Date());

  // Bloques oficiales del Tec
  const bloquesTec = [
    "07:00 - 08:00",
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
  ];

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- DATOS REACTIVOS DE LA DB ---
  // Al usar useLiveQuery, el Sidebar se re-renderiza solo en cuanto cambias el nombre en Config
  const perfil = useLiveQuery(() => db.perfil.toCollection().first());
  const horario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first()
  );
  const amigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray()
  );

  const claseHoy = obtenerClaseActual(horario?.materias);

  const horaActualNum = ahora.getHours() * 100 + ahora.getMinutes();
  const estaCerrado = ahora.getHours() < 7 || ahora.getHours() >= 22;

  const rangoActualSistema =
    bloquesTec.find((bloque) => {
      const [inicio, fin] = bloque.split(" - ");
      const inicioNum = parseInt(inicio.replace(":", ""));
      const finNum = parseInt(fin.replace(":", ""));
      return horaActualNum >= inicioNum && horaActualNum < finNum;
    }) || "Fuera de bloque";

  const amigosEnClaseAhora = amigos?.filter((amigo) => {
    const suClase = obtenerClaseActual(amigo.materias);
    const rangoBuscado = claseHoy?.rango || rangoActualSistema;
    return suClase && suClase.rango === rangoBuscado;
  });

  const menuItems = [
    { icon: <Home size={20} />, label: "Mi Horario", href: "/" },
    { icon: <Users size={20} />, label: "Amigos", href: "/amigos" },
    { icon: <Settings size={20} />, label: "Configuración", href: "/config" },
  ];

  return (
    <>
      {/* MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-bg/80 border-t border-white/10 flex justify-around p-4 z-50 backdrop-blur-xl">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-2 rounded-lg ${
              pathname === item.href ? "text-tec-blue" : "text-gray-500"
            }`}
          >
            {item.icon}
          </Link>
        ))}
      </nav>

      {/* DESKTOP */}
      <aside className="w-72 bg-card-bg border-r border-white/5 flex flex-col p-6 hidden md:flex h-screen sticky top-0 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-tec-blue font-black text-2xl tracking-tighter italic uppercase">
            TEC MADERO
          </h2>

          {/* PERFIL ACTUALIZADO (Sin número de control) */}
          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tec-blue/20 flex items-center justify-center text-tec-blue font-black text-lg">
                {perfil?.nombre ? (
                  perfil.nombre[0].toUpperCase()
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                  Estudiante
                </p>
                <span className="text-sm font-bold truncate block leading-tight">
                  {perfil?.nombre || "Invitado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MONITOR DE BLOQUE */}
        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col gap-1 ${
            estaCerrado
              ? "bg-red-500/5 border-red-500/20"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
            <span>Bloque Actual</span>
            <div
              className={`w-2 h-2 rounded-full ${
                estaCerrado
                  ? "bg-red-500 animate-pulse"
                  : "bg-green-500 animate-pulse"
              }`}
            />
          </div>
          <p className="text-xl font-mono font-black">
            {estaCerrado ? "CERRADO TEC" : rangoActualSistema}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                pathname === item.href
                  ? "bg-tec-blue text-white shadow-lg"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* WIDGET INFERIOR */}
        <div
          className={`mt-auto p-5 rounded-[2rem] border transition-all ${
            claseHoy && !estaCerrado
              ? "bg-gradient-to-br from-tec-blue/20 to-accent-purple/10 border-tec-blue/30"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap
              size={14}
              className={
                claseHoy && !estaCerrado
                  ? "text-tec-blue fill-tec-blue"
                  : "text-gray-600"
              }
            />
            <span className="text-[10px] font-black uppercase tracking-tighter">
              {estaCerrado
                ? "Fuera de Horario"
                : claseHoy
                ? "En Clase Ahora"
                : "Tiempo Libre"}
            </span>
          </div>

          {claseHoy && !estaCerrado ? (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-black leading-tight tracking-tight">
                  {claseHoy.rango}
                </p>
                <p className="text-xs text-gray-400 font-bold uppercase mt-1 line-clamp-1">
                  {claseHoy.nombre}
                </p>
                <p className="text-[10px] text-tec-blue font-black mt-1 uppercase">
                  Salón: {claseHoy.salon}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-2 text-center">
                  Ocupados ahora:
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {amigosEnClaseAhora?.map((amigo) => (
                    <span
                      key={amigo.id}
                      className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold border border-white/5 text-gray-300"
                    >
                      {amigo.nombreUsuario.split(" ")[0]}
                    </span>
                  ))}
                  {amigosEnClaseAhora?.length === 0 && (
                    <span className="text-[8px] text-gray-700 italic">
                      Nadie más
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 font-medium leading-snug">
              {estaCerrado ? "Campus Cerrado." : "No tienes clases."}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
