"use client";
import {
  Home,
  Users,
  Settings,
  User,
  Zap,
  MapPin,
  CheckCircle2,
  X,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { obtenerClaseActual } from "@/lib/parser";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [ahora, setAhora] = useState(new Date());
  const [amigoTooltip, setAmigoTooltip] = useState(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

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
      return (
        horaActualNum >= parseInt(inicio.replace(":", "")) &&
        horaActualNum < parseInt(fin.replace(":", ""))
      );
    }) || "Fuera de bloque";

  // LOGICA: Buscar amigos en el bloque actual (sea el tuyo o el del sistema si estás libre)
  const amigosEnClaseAhora =
    amigos
      ?.map((amigo) => {
        const suClase = obtenerClaseActual(amigo.materias);
        const rangoBuscado = claseHoy?.rango || rangoActualSistema;

        if (suClase && suClase.rango === rangoBuscado) {
          const esMismaClase =
            claseHoy &&
            suClase.nombre.toLowerCase() === claseHoy.nombre.toLowerCase() &&
            suClase.salon.toLowerCase() === claseHoy.salon.toLowerCase();
          return { ...amigo, claseActual: suClase, esMismaClase };
        }
        return null;
      })
      .filter(Boolean) || [];

  const menuItems = [
    { icon: <Home size={20} />, label: "Mi Horario", href: "/" },
    { icon: <Users size={20} />, label: "Amigos", href: "/amigos" },
    { icon: <Settings size={20} />, label: "Configuración", href: "/config" },
  ];

  const tieneContenido =
    (claseHoy || amigosEnClaseAhora.length > 0) && !estaCerrado;

  return (
    <>
      {/* MOBILE UI */}
      <div className="md:hidden">
        {tieneContenido && (
          <div
            onClick={() => setShowMobileDrawer(true)}
            className="fixed bottom-20 left-4 right-4 bg-card-bg/95 border border-tec-blue/40 p-3 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 z-[45] backdrop-blur-md active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap
                  size={16}
                  className={`${
                    claseHoy ? "text-tec-blue fill-tec-blue" : "text-gray-500"
                  }`}
                />
                {amigosEnClaseAhora.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-card-bg">
                    {amigosEnClaseAhora.length}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-tec-blue leading-none mb-1">
                  {claseHoy ? "Tu Clase" : "Amigos en Clase"}
                </p>
                <p className="text-[11px] font-bold text-white/90 truncate max-w-[180px]">
                  {claseHoy
                    ? claseHoy.nombre
                    : `${amigosEnClaseAhora.length} amigos ocupados`}
                </p>
              </div>
            </div>
            <ChevronUp size={16} className="text-gray-500 animate-bounce" />
          </div>
        )}

        {showMobileDrawer && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileDrawer(false)}
            />
            <div className="relative bg-card-bg border-t border-white/10 rounded-t-[2.5rem] p-6 pb-10 animate-in slide-in-from-bottom-full duration-300">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <header className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black italic text-white uppercase leading-none">
                    {claseHoy?.rango || rangoActualSistema}
                  </h3>
                  {claseHoy && (
                    <>
                      <p className="text-tec-blue font-bold text-sm mt-1 uppercase tracking-tight">
                        {claseHoy.nombre}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-gray-500 text-[10px] font-black">
                        <MapPin size={12} /> SALÓN: {claseHoy.salon}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-2 bg-white/5 rounded-full"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  Estado de la red:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {amigosEnClaseAhora.map((amigo) => (
                    <div
                      key={amigo.id}
                      className={`p-3 rounded-2xl border ${
                        amigo.esMismaClase
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-white/5 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {amigo.esMismaClase && (
                          <CheckCircle2 size={12} className="text-green-500" />
                        )}
                        <p className="text-xs font-black uppercase truncate">
                          {amigo.nombreUsuario.split(" ")[0]}
                        </p>
                      </div>
                      <p className="text-[8px] text-gray-500 font-bold uppercase truncate">
                        {amigo.claseActual.nombre}
                      </p>
                      <p className="text-[8px] text-tec-blue font-black mt-1">
                        S: {amigo.claseActual.salon}
                      </p>
                    </div>
                  ))}
                  {amigosEnClaseAhora.length === 0 && (
                    <p className="text-[10px] text-gray-700 italic col-span-2 text-center py-4">
                      Nadie en red tiene clase ahora
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-card-bg/90 border-t border-white/10 flex justify-around p-4 z-50 backdrop-blur-xl">
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
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-72 bg-card-bg border-r border-white/5 flex flex-col p-6 hidden md:flex h-screen sticky top-0 overflow-y-auto no-scrollbar">
        <div className="mb-8">
          <h2 className="text-tec-blue font-black text-2xl tracking-tighter italic uppercase drop-shadow-[0_0_8px_rgba(0,82,155,0.4)]">
            TEC MADERO
          </h2>
          <div className="mt-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-tec-blue/20 flex items-center justify-center text-tec-blue font-black text-xl border border-tec-blue/30">
                {perfil?.nombre ? (
                  perfil.nombre[0].toUpperCase()
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                  Estudiante
                </p>
                <span className="text-md font-black truncate block leading-tight text-white/90">
                  {perfil?.nombre || "Invitado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col gap-1 transition-colors ${
            estaCerrado
              ? "bg-red-500/5 border-red-500/20"
              : "bg-white/[0.02] border-white/10 shadow-lg"
          }`}
        >
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
            <span>Estado Actual</span>
            <div
              className={`w-2 h-2 rounded-full ${
                estaCerrado
                  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  : "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
              }`}
            />
          </div>
          <p className="text-xl font-mono font-black text-white/80">
            {estaCerrado ? "CERRADO" : rangoActualSistema}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3.5 rounded-xl font-black text-sm transition-all ${
                pathname === item.href
                  ? "bg-tec-blue text-white shadow-[0_0_20px_rgba(0,82,155,0.3)] scale-[1.02]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="uppercase tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* WIDGET INFERIOR DINAMICO */}
        <div
          className={`mt-auto p-5 rounded-[2.2rem] border transition-all relative overflow-visible ${
            tieneContenido
              ? "bg-gradient-to-br from-tec-blue/20 to-black/40 border-tec-blue/40 shadow-2xl"
              : "bg-white/[0.02] border-white/5"
          }`}
        >
          {amigoTooltip && (
            <div className="absolute bottom-[105%] left-0 w-[110%] -left-[5%] p-4 bg-card-bg border border-tec-blue/50 text-white rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 z-[60] backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-widest text-tec-blue mb-1">
                {amigoTooltip.nombreUsuario}
              </p>
              <p className="text-xs font-bold leading-tight mb-2 text-white/90">
                {amigoTooltip.claseActual.nombre}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
                <MapPin size={12} className="text-tec-blue" /> Salón:{" "}
                <span className="text-white">
                  {amigoTooltip.claseActual.salon}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Zap
              size={14}
              className={
                claseHoy
                  ? "text-tec-blue fill-tec-blue shadow-[0_0_5px_blue]"
                  : "text-gray-600"
              }
            />
            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
              {estaCerrado
                ? "Fuera de Horario"
                : claseHoy
                ? "En Clase"
                : amigosEnClaseAhora.length > 0
                ? "Red en Clase"
                : "Libre"}
            </span>
          </div>

          {tieneContenido ? (
            <div className="space-y-4">
              {claseHoy ? (
                <div>
                  <p className="text-xl font-black leading-tight tracking-tighter text-white">
                    {claseHoy.rango}
                  </p>
                  <p className="text-xs text-gray-400 font-bold uppercase mt-1 line-clamp-1 italic">
                    {claseHoy.nombre}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-tec-blue font-black uppercase text-[11px]">
                    <MapPin size={10} /> Aula: {claseHoy.salon}
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 font-black uppercase">
                    Tu estado:
                  </p>
                  <p className="text-xs font-bold text-white uppercase italic">
                    Sin clases asignadas
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2.5">
                  Ocupados ahora:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {amigosEnClaseAhora.map((amigo) => (
                    <button
                      key={amigo.id}
                      onMouseEnter={() => setAmigoTooltip(amigo)}
                      onMouseLeave={() => setAmigoTooltip(null)}
                      onClick={() =>
                        setAmigoTooltip(
                          amigoTooltip?.id === amigo.id ? null : amigo
                        )
                      }
                      className={`relative px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border flex items-center gap-1.5 ${
                        amigo.esMismaClase
                          ? "bg-green-500/10 border-green-500/50 text-green-400"
                          : "bg-white/5 border-white/5 text-gray-400 hover:border-tec-blue/50"
                      }`}
                    >
                      {amigo.esMismaClase && (
                        <CheckCircle2 size={10} className="animate-pulse" />
                      )}
                      {amigo.nombreUsuario.split(" ")[0]}
                    </button>
                  ))}
                  {amigosEnClaseAhora.length === 0 && (
                    <span className="text-[9px] text-gray-600 font-bold italic uppercase">
                      Nadie activo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 font-bold uppercase tracking-tight italic">
              {estaCerrado ? "Campus inactivo." : "No hay actividad en red."}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
