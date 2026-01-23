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
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { obtenerClaseActual, formatearRango } from "@/lib/parser";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [ahora, setAhora] = useState(null);
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
    setMounted(true);

    setMounted(true);

    // Solicitar permiso de notificaciones al cargar
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const actualizarTodo = () => {
      setAhora(new Date());
    };

    actualizarTodo(); // Ejecución inmediata al cargar

    // FUNCIÓN MÁGICA DE SINCRONIZACIÓN
    const sincronizar = () => {
      const ahoraMismo = new Date();
      // Calculamos cuántos milisegundos faltan para el segundo 0 del siguiente minuto
      const msParaElSiguienteMinuto =
        1000 -
        ahoraMismo.getMilliseconds() +
        (59 - ahoraMismo.getSeconds()) * 1000;

      setTimeout(() => {
        actualizarTodo(); // Esto ocurrirá exactamente al segundo :00
        // Una vez sincronizados, repetimos cada minuto
        setInterval(actualizarTodo, 60000);
      }, msParaElSiguienteMinuto);
    };

    sincronizar();

    return () => {
      // Limpieza de timers para evitar fugas de memoria
      const ids = setTimeout(() => {});
      for (let i = 0; i < ids; i++) clearTimeout(i);
    };
  }, []);

  const perfil = useLiveQuery(() => db.perfil.toCollection().first());
  const formatoHora = perfil?.formatoHora || 24;

  const horario = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "true" }).first(),
  );
  const amigos = useLiveQuery(() =>
    db.horarios.where({ esPrincipal: "false" }).toArray(),
  );

  const claseHoy = ahora ? obtenerClaseActual(horario?.materias) : null;
  const horaActualNum = ahora ? ahora.getHours() * 100 + ahora.getMinutes() : 0;
  const estaCerrado = ahora
    ? ahora.getHours() < 7 || ahora.getHours() >= 22
    : true;

  const rangoActualRaw = ahora
    ? bloquesTec.find((bloque) => {
        const [inicio, fin] = bloque.split(" - ");
        return (
          horaActualNum >= parseInt(inicio.replace(":", "")) &&
          horaActualNum < parseInt(fin.replace(":", ""))
        );
      }) || "Fuera de bloque"
    : "---";

  const rangoActualSistema = formatearRango(
    rangoActualRaw || "---",
    formatoHora,
  );

  const amigosEnClaseAhora = ahora
    ? (amigos || [])
        .map((amigo) => {
          const suClase = obtenerClaseActual(amigo.materias);
          const rangoBuscado = claseHoy?.rango || rangoActualRaw;
          if (suClase && suClase.rango === rangoBuscado) {
            const esMismaClase =
              claseHoy &&
              suClase.nombre.toLowerCase() === claseHoy.nombre.toLowerCase() &&
              suClase.salon.toLowerCase() === claseHoy.salon.toLowerCase();
            return { ...amigo, claseActual: suClase, esMismaClase };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  useEffect(() => {
    // Solo si hay una clase y el navegador soporta Service Workers
    if (claseHoy && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Enviamos la info de la clase al sw.js
        registration.active.postMessage({
          type: "NUEVA_CLASE",
          payload: {
            nombre: claseHoy.nombre,
            salon: claseHoy.salon,
            profesor: claseHoy.profesor || "No asignado",
            rango: formatearRango(claseHoy.rango, formatoHora),
          },
        });
      });
    }
  }, [claseHoy?.nombre, claseHoy?.rango]); // Solo se dispara cuando cambia la clase

  const menuItems = [
    { icon: <Home size={20} />, label: "Mi Horario", href: "/" },
    { icon: <Users size={20} />, label: "Amigos", href: "/amigos" },
    { icon: <Settings size={20} />, label: "Configuración", href: "/config" },
  ];

  const tieneContenido =
    (claseHoy || amigosEnClaseAhora.length > 0) && !estaCerrado;

  // Componente Reutilizable para la tarjeta de amigo (Móvil y Escritorio)
  const FriendCard = ({ amigo }) => (
    <div
      className={`p-3 rounded-2xl border transition-all duration-300 ${
        amigo.esMismaClase
          ? "bg-green-500/10 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
          : "bg-white/[0.03] border-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 overflow-hidden">
          {amigo.esMismaClase && (
            <CheckCircle2
              size={12}
              className="text-green-500 shrink-0 animate-pulse"
            />
          )}
          <p
            className={`text-[11px] font-black uppercase truncate ${amigo.esMismaClase ? "text-green-400" : "text-white/90"}`}
          >
            {amigo.nombreUsuario.split(" ")[0]}
          </p>
        </div>
        <p
          className={`text-[9px] font-black shrink-0 ${amigo.esMismaClase ? "text-green-500" : "text-tec-blue"}`}
        >
          S: {amigo.claseActual.salon}
        </p>
      </div>
      <p className="text-[9px] text-gray-500 font-bold uppercase truncate">
        {amigo.claseActual.nombre}
      </p>
      {/* PROFESOR DEL AMIGO */}
      {amigo.claseActual.profesor && (
        <p className="text-[8px] text-gray-600 font-bold uppercase truncate mt-0.5 italic">
          {amigo.claseActual.profesor}
        </p>
      )}
    </div>
  );

  if (!mounted) return <aside className="md:w-72 bg-card-bg h-screen" />;

  return (
    <aside className="contents">
      {/* --- UI MÓVIL --- */}
      <div className="md:hidden">
        {tieneContenido && (
          <div
            onClick={() => setShowMobileDrawer(true)}
            className="fixed bottom-20 left-4 right-4 bg-card-bg/95 border border-tec-blue/40 p-3 rounded-2xl shadow-2xl flex items-center justify-between z-[45] backdrop-blur-md active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap
                  size={16}
                  className={`${claseHoy ? "text-tec-blue fill-tec-blue" : "text-gray-500"}`}
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
            <div className="relative bg-card-bg border-t border-white/10 rounded-t-[2.5rem] p-6 pb-10 animate-in slide-in-from-bottom-full">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black italic text-white uppercase leading-none">
                    {claseHoy
                      ? formatearRango(claseHoy.rango, formatoHora)
                      : rangoActualSistema}
                  </h3>
                  {claseHoy && (
                    <>
                      <p className="text-tec-blue font-bold text-sm mt-1 uppercase">
                        {claseHoy.nombre}
                      </p>
                      {/* PROFESOR EN CAJÓN MÓVIL */}
                      {claseHoy.profesor && (
                        <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 flex items-center gap-1">
                          <GraduationCap size={12} className="text-tec-blue" />{" "}
                          {claseHoy.profesor}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-gray-500 text-[10px] font-black uppercase">
                        <MapPin size={12} /> SALÓN: {claseHoy.salon}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-2 bg-white/5 rounded-full text-white"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                {amigosEnClaseAhora.map((amigo) => (
                  <FriendCard key={amigo.id} amigo={amigo} />
                ))}
              </div>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-card-bg/90 border-t border-white/10 flex justify-around p-4 z-50 backdrop-blur-xl">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-lg ${pathname === item.href ? "text-tec-blue" : "text-gray-500"}`}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      </div>

      {/* --- SIDEBAR ESCRITORIO --- */}
      <aside className="w-72 bg-card-bg border-r border-white/5 flex flex-col p-6 hidden md:flex h-screen sticky top-0 overflow-y-auto no-scrollbar">
        <div className="mb-8">
          <h2 className="text-tec-blue font-black text-2xl tracking-tighter italic uppercase">
            TEC MADERO
          </h2>
          <div className="mt-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
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
                <span className="text-md font-black truncate block text-white/90">
                  {perfil?.nombre || "Invitado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col gap-1 ${estaCerrado ? "bg-red-500/5 border-red-500/20" : "bg-white/[0.02] border-white/10 shadow-lg"}`}
        >
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
            <span>Estado Actual</span>
            <div
              className={`w-2 h-2 rounded-full ${estaCerrado ? "bg-red-500" : "bg-green-500 animate-pulse"}`}
            />
          </div>
          <p
            suppressHydrationWarning
            className="text-lg font-mono font-black text-white/80 uppercase"
          >
            {estaCerrado ? "CERRADO" : rangoActualSistema}
          </p>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3.5 rounded-xl font-black text-sm transition-all ${pathname === item.href ? "bg-tec-blue text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
            >
              {item.icon}
              <span className="uppercase tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        {!estaCerrado && amigosEnClaseAhora.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
              <Users size={12} /> Amigos en Clase
            </p>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
              {amigosEnClaseAhora.map((amigo) => (
                <FriendCard key={amigo.id} amigo={amigo} />
              ))}
            </div>
          </div>
        )}

        <div
          className={`mt-auto p-5 rounded-[2.2rem] border transition-all relative ${tieneContenido && claseHoy ? "bg-gradient-to-br from-tec-blue/20 to-black/40 border-tec-blue/40" : "bg-white/[0.02] border-white/5"}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap
              size={14}
              className={
                claseHoy ? "text-tec-blue fill-tec-blue" : "text-gray-600"
              }
            />
            <span className="text-[10px] font-black uppercase text-gray-400">
              {estaCerrado
                ? "Fuera de Horario"
                : claseHoy
                  ? "En Clase"
                  : "Libre"}
            </span>
          </div>
          {claseHoy && (
            <div>
              <p className="text-lg font-black leading-tight text-white">
                {formatearRango(claseHoy.rango, formatoHora)}
              </p>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1 italic">
                {claseHoy.nombre}
              </p>
              {/* PROFESOR EN TU CLASE (ESCRITORIO) */}
              {claseHoy.profesor && (
                <p className="text-[10px] text-white/40 font-bold uppercase mt-0.5 truncate">
                  {claseHoy.profesor}
                </p>
              )}
              <div className="flex items-center gap-1 mt-2 text-tec-blue font-black uppercase text-[11px]">
                <MapPin size={10} /> Aula: {claseHoy.salon}
              </div>
            </div>
          )}
        </div>
      </aside>
    </aside>
  );
}
