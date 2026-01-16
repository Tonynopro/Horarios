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

  // Bloques oficiales del Tec para el monitor
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

  // Reloj interno para actualizar el sidebar cada minuto
  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Datos de la DB
  const perfil = useLiveQuery(() => db.perfil.toCollection().first());
  const horario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first()
  );
  const amigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray()
  );

  const claseHoy = obtenerClaseActual(horario?.materias);

  // Lógica de Estado y Rango
  const horaActualNum = ahora.getHours() * 100 + ahora.getMinutes();
  const estaCerrado = ahora.getHours() < 7 || ahora.getHours() >= 22;

  // Determinar en qué bloque de la lista estamos
  const rangoActualSistema =
    bloquesTec.find((bloque) => {
      const [inicio, fin] = bloque.split(" - ");
      const inicioNum = parseInt(inicio.replace(":", ""));
      const finNum = parseInt(fin.replace(":", ""));
      return horaActualNum >= inicioNum && horaActualNum < finNum;
    }) || "Fuera de bloque";

  // Amigos que tienen clase en este mismo bloque (sin importar si es la misma materia)
  const amigosEnClaseAhora = amigos?.filter((amigo) => {
    const suClase = obtenerClaseActual(amigo.materias);
    // Usamos el rango detectado por el sistema o el de tu clase actual para comparar
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-bg/80 border-t border-white/10 flex justify-around p-4 z-50 backdrop-blur-xl">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-2 rounded-lg transition-colors ${
              pathname === item.href ? "text-tec-blue" : "text-gray-500"
            }`}
          >
            {item.icon}
          </Link>
        ))}
      </nav>

      <aside className="w-72 bg-card-bg border-r border-white/5 flex flex-col p-6 hidden md:flex h-screen sticky top-0 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-tec-blue font-black text-2xl tracking-tighter italic">
            TEC MADERO
          </h2>
          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-tec-blue/20 flex items-center justify-center text-tec-blue font-bold">
                {perfil?.nombre ? perfil.nombre[0] : <User size={16} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-sm font-bold truncate block">
                  {perfil?.nombre || "Invitado"}
                </span>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                  {perfil?.control || "22070000"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MONITOR DE BLOQUE HORARIO */}
        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col gap-1 transition-all ${
            estaCerrado
              ? "bg-red-500/5 border-red-500/20"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
              Bloque Actual
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                estaCerrado
                  ? "bg-red-500 shadow-[0_0_8px_red]"
                  : "bg-green-500 shadow-[0_0_8px_green]"
              } animate-pulse`}
            />
          </div>

          {/* Muestra el rango (7-8, 8-9) o Cerrado si aplica */}
          <p className="text-xl font-mono font-black uppercase tracking-tighter">
            {estaCerrado ? "CERRADO TEC" : rangoActualSistema}
          </p>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            {estaCerrado ? "Campus fuera de servicio" : "Tec en operación"}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                pathname === item.href
                  ? "bg-tec-blue text-white shadow-lg shadow-blue-900/40"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* WIDGET CLASE ACTUAL */}
        <div
          className={`mt-auto p-5 rounded-[2rem] border transition-all relative overflow-hidden ${
            claseHoy && !estaCerrado
              ? "bg-gradient-to-br from-tec-blue/20 to-accent-purple/10 border-tec-blue/30"
              : "bg-white/5 border-white/10"
          }`}
        >
          {estaCerrado && (
            <Moon
              size={40}
              className="absolute -right-4 -top-4 text-white/5 rotate-12"
            />
          )}

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
                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">
                  Ocupados en este bloque:
                </p>
                <div className="flex flex-wrap gap-1">
                  {amigosEnClaseAhora?.map((amigo) => (
                    <span
                      key={amigo.id}
                      className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold border border-white/5 text-gray-300"
                    >
                      {amigo.nombreUsuario.split(" ")[0]}
                    </span>
                  ))}
                  {amigosEnClaseAhora?.length === 0 && (
                    <span className="text-[9px] text-gray-700 italic">
                      Nadie más
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 font-medium leading-snug">
              {estaCerrado
                ? "Campus Cerrado."
                : "No tienes clases en este bloque."}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
