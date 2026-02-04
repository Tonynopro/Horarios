"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import {
  X,
  Plus,
  Save,
  Clock,
  Trash2,
  BookOpen,
  MapPin,
  User,
} from "lucide-react";

export default function EditorHorarioManual({
  onSave,
  onCancel,
  nombreInicial = "",
  materiasIniciales = [],
  idUsuarioEditando = null, // <--- ID de a quién estamos editando (para no auto-actualizarlo doble)
  amigosContexto = [], // <--- Lista de amigos
  miHorario = null, // <--- Tu propio horario para que te actualice a ti también
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [salonTemp, setSalonTemp] = useState("");

  const [materias, setMaterias] = useState(() => {
    if (!materiasIniciales || materiasIniciales.length === 0) return [];
    const agrupadas = [];
    materiasIniciales.forEach((m) => {
      const rangoNormalizado = m.rango.replace(/\s/g, "");
      const existente = agrupadas.find(
        (a) =>
          a.nombre.toLowerCase() === m.nombre.toLowerCase() &&
          a.salon.toLowerCase() === m.salon.toLowerCase() &&
          a.bloque.replace(/\s/g, "") === rangoNormalizado,
      );

      if (existente) {
        if (!existente.dias.includes(m.dia)) existente.dias.push(m.dia);
      } else {
        agrupadas.push({
          id: Math.random(),
          nombre: m.nombre,
          salon: m.salon,
          profesor: m.profesor || "",
          bloque: m.rango,
          dias: [m.dia],
        });
      }
    });
    return agrupadas;
  });

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
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  // --- HELPER: Obtener UNIVERSO de gente (Amigos + Yo) ---
  const obtenerPoolUsuarios = () => {
    const pool = [...amigosContexto];
    // Si yo existo y NO soy la persona que se está editando ahorita, agrégame al pool
    if (miHorario && miHorario.id !== idUsuarioEditando) {
      pool.push({ ...miHorario, esYo: true }); // Marcamos que soy yo para feedback visual
    }
    // Filtramos para NO incluir a la persona que ya estamos editando en el formulario
    return pool.filter((u) => u.id !== idUsuarioEditando);
  };

  // --- LÓGICA DE ACTUALIZACIÓN MASIVA (SOLO POR SALÓN) ---
  const verificarImpactoSocial = async (idMateriaEditada) => {
    const materiaActual = materias.find((m) => m.id === idMateriaEditada);
    if (!materiaActual) return;

    const nuevoSalon = materiaActual.salon.trim();
    const viejoSalon = salonTemp.trim(); // El que guardamos en onFocus

    // Validaciones
    if (!nuevoSalon || !viejoSalon || nuevoSalon === viejoSalon) return;

    const pool = obtenerPoolUsuarios();
    if (pool.length === 0) return;

    // BUSCAMOS AFECTADOS
    // Criterio estricto: Coincidir en SALÓN VIEJO + DÍA + HORA.
    // (Ignoramos el nombre de la materia a propósito)
    const afectados = [];

    pool.forEach((usuario) => {
      // Revisamos si el usuario tiene ALGUNA clase en ese salón, día y hora
      const tieneClaseAhi = usuario.materias?.some(
        (m) =>
          m.salon.trim().toLowerCase() === viejoSalon.toLowerCase() && // Mismo salón viejo
          m.rango === materiaActual.bloque && // Misma hora
          materiaActual.dias.includes(m.dia), // Mismo día
      );

      if (tieneClaseAhi) {
        afectados.push(usuario);
      }
    });

    if (afectados.length === 0) return;

    // PREGUNTAR AL USUARIO
    const nombres = afectados
      .map((a) => (a.esYo ? "TÚ" : a.nombreUsuario))
      .join(", ");
    const confirmar = window.confirm(
      `CAMBIO DE SALÓN DETECTADO\n\n` +
        `Las siguientes personas también tienen clase en el salón "${viejoSalon}" a esta hora:\n` +
        `-> ${nombres}\n\n` +
        `¿Quieres moverlos al nuevo salón "${nuevoSalon}" también?`,
    );

    // EJECUTAR CAMBIOS EN DB
    if (confirmar) {
      let actualizados = 0;
      for (const usuario of afectados) {
        const nuevasMaterias = usuario.materias.map((m) => {
          // Si coincide con las condiciones (Salón viejo + hora + dia), actualizamos
          if (
            m.salon.trim().toLowerCase() === viejoSalon.toLowerCase() &&
            m.rango === materiaActual.bloque &&
            materiaActual.dias.includes(m.dia)
          ) {
            return { ...m, salon: nuevoSalon };
          }
          return m;
        });

        await db.horarios.update(usuario.id, { materias: nuevasMaterias });
        actualizados++;
      }
      alert(`Se actualizó el horario de ${actualizados} persona(s).`);
    }

    setSalonTemp("");
  };

  const agregarMateria = () => {
    setMaterias([
      ...materias,
      {
        id: Date.now(),
        nombre: "",
        salon: "",
        profesor: "",
        bloque: bloquesTec[1],
        dias: [],
      },
    ]);
  };

  const actualizarMateria = (id, campo, valor) => {
    setMaterias(
      materias.map((m) => (m.id === id ? { ...m, [campo]: valor } : m)),
    );
  };

  const toggleDia = (mId, dia) => {
    setMaterias(
      materias.map((m) => {
        if (m.id === mId) {
          const nuevosDias = m.dias.includes(dia)
            ? m.dias.filter((d) => d !== dia)
            : [...m.dias, dia];
          return { ...m, dias: nuevosDias };
        }
        return m;
      }),
    );
  };

  // --- VISUALIZACIÓN: Buscar gente en el salón actual ---
  const obtenerGenteEnClase = (dia, bloque, salonActual) => {
    if (!salonActual) return [];
    const pool = obtenerPoolUsuarios();

    // Filtramos solo por SALÓN, HORA y DÍA (Ignoramos nombre materia)
    return pool.filter((u) =>
      u.materias?.some(
        (m) =>
          m.dia === dia &&
          m.rango === bloque &&
          m.salon.trim().toLowerCase() === salonActual.trim().toLowerCase(),
      ),
    );
  };

  const validarYGuardar = () => {
    if (!nombre.trim()) return alert("Escribe el nombre del perfil");
    if (materias.length === 0) return alert("Agrega al menos una materia");

    const materiasFinales = [];
    const ocupados = new Set();

    for (const m of materias) {
      if (!m.nombre.trim() || m.dias.length === 0) {
        alert(`Faltan datos en la materia: ${m.nombre || "Sin nombre"}`);
        return;
      }
      const [inicio, fin] = m.bloque.split("-").map((hora) => hora.trim());

      for (const dia of m.dias) {
        const key = `${m.bloque.replace(/\s/g, "")}-${dia}`;
        if (ocupados.has(key)) {
          alert(`¡Choque! Tienes dos materias el ${dia} a las ${m.bloque}`);
          return;
        }
        ocupados.add(key);

        materiasFinales.push({
          nombre: m.nombre.trim(),
          salon: m.salon.trim() || "S/N",
          profesor: m.profesor.trim() || "",
          dia,
          rango: m.bloque,
          inicio,
          fin,
        });
      }
    }
    onSave({ nombreUsuario: nombre, materias: materiasFinales });
  };

  return (
    <div className="bg-card-bg border border-white/10 rounded-[2.5rem] p-5 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
      <header className="flex justify-between items-start mb-6 shrink-0">
        <div className="space-y-1 flex-1 pr-4">
          <h2 className="text-xl font-black uppercase italic text-white leading-none">
            {materiasIniciales.length > 0 ? "Editar Horario" : "Editor Manual"}
          </h2>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del perfil..."
            className="w-full bg-transparent border-b border-white/10 py-1 text-sm font-bold text-tec-blue outline-none focus:border-tec-blue transition-colors placeholder:text-gray-700"
          />
        </div>
        <button
          onClick={onCancel}
          className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar py-2">
        {materias.map((m) => (
          <div
            key={m.id}
            className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl space-y-4 relative animate-in slide-in-from-top-2"
          >
            <button
              onClick={() => setMaterias(materias.filter((x) => x.id !== m.id))}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                <BookOpen size={12} className="text-tec-blue" />
                <input
                  placeholder="Materia..."
                  value={m.nombre}
                  onChange={(e) =>
                    actualizarMateria(m.id, "nombre", e.target.value)
                  }
                  className="bg-transparent text-[10px] font-bold text-white outline-none w-full"
                />
              </div>

              {/* INPUT SALON: DETECCIÓN AL SALIR (ONBLUR) */}
              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                <MapPin size={12} className="text-tec-blue" />
                <input
                  placeholder="Salón..."
                  value={m.salon}
                  onFocus={(e) => setSalonTemp(e.target.value)} // Guardar valor viejo
                  onBlur={() => verificarImpactoSocial(m.id)} // Checar cambios al salir
                  onChange={(e) =>
                    actualizarMateria(m.id, "salon", e.target.value)
                  }
                  className="bg-transparent text-[10px] font-bold text-white outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                <User size={12} className="text-tec-blue" />
                <input
                  placeholder="Profesor (Opcional)..."
                  value={m.profesor}
                  onChange={(e) =>
                    actualizarMateria(m.id, "profesor", e.target.value)
                  }
                  className="bg-transparent text-[10px] font-bold text-white outline-none w-full"
                />
              </div>
            </div>

            {/* VISUALIZACIÓN DE GENTE (BUBBLES) */}
            <div className="flex flex-wrap gap-2 px-1 mt-1">
              {m.dias.map((dia) => {
                const genteAhi = obtenerGenteEnClase(dia, m.bloque, m.salon);
                if (genteAhi.length === 0) return null;

                return (
                  <div
                    key={dia}
                    className="flex items-center gap-1 bg-tec-blue/10 px-2 py-1 rounded-lg border border-tec-blue/20"
                  >
                    <span className="text-[8px] font-bold text-tec-blue uppercase">
                      {dia.slice(0, 3)}:
                    </span>
                    <div className="flex -space-x-1.5">
                      {genteAhi.map((u) => (
                        <div
                          key={u.id}
                          onClick={() =>
                            alert(
                              `${u.esYo ? "TÚ" : u.nombreUsuario} está en el salón ${m.salon}`,
                            )
                          }
                          className="group relative cursor-pointer"
                        >
                          <div className="w-4 h-4 rounded-full bg-tec-blue flex items-center justify-center text-[8px] text-white font-bold border border-black relative z-10 hover:z-20 hover:scale-110 transition-all shadow-md">
                            {u.esYo ? "YO" : u.nombreUsuario[0]}
                          </div>

                          {/* TOOLTIP DESKTOP (Hover) */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                            {u.esYo ? "TÚ" : u.nombreUsuario}
                            {/* Flechita del tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 bg-tec-blue/10 p-2 rounded-xl border border-tec-blue/20 mt-2">
              <Clock size={12} className="text-tec-blue" />
              <select
                value={m.bloque}
                onChange={(e) =>
                  actualizarMateria(m.id, "bloque", e.target.value)
                }
                className="bg-transparent text-[10px] font-black uppercase text-gray-300 outline-none w-full cursor-pointer"
              >
                {bloquesTec.map((b) => (
                  <option key={b} value={b} className="bg-card-bg">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between gap-1">
              {diasSemana.map((dia) => (
                <button
                  key={dia}
                  onClick={() => toggleDia(m.id, dia)}
                  className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${
                    m.dias.includes(dia)
                      ? "bg-tec-blue border-tec-blue text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-gray-600 hover:border-white/10"
                  }`}
                >
                  {dia.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={agregarMateria}
          className="w-full py-4 border-2 border-dashed border-white/5 rounded-3xl text-gray-500 flex items-center justify-center gap-2 hover:bg-white/5 hover:text-tec-blue transition-all font-black text-[10px] uppercase"
        >
          <Plus size={16} /> Agregar Materia
        </button>
      </div>

      <footer className="mt-6 shrink-0 space-y-3">
        <button
          onClick={validarYGuardar}
          className="w-full bg-tec-blue hover:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> Guardar Cambios
        </button>
      </footer>
    </div>
  );
}
