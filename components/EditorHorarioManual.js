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
  Copy, // <--- IMPORTAMOS EL ICONO DE COPIAR
} from "lucide-react";

export default function EditorHorarioManual({
  onSave,
  onCancel,
  nombreInicial = "",
  materiasIniciales = [],
  idUsuarioEditando = null,
  amigosContexto = [],
  miHorario = null,
}) {
  const [nombre, setNombre] = useState(nombreInicial);

  const [salonTemp, setSalonTemp] = useState("");
  const [bloqueTemp, setBloqueTemp] = useState("");

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

  const obtenerPoolUsuarios = () => {
    const pool = [...amigosContexto];
    if (miHorario && miHorario.id !== idUsuarioEditando) {
      pool.push({ ...miHorario, esYo: true });
    }
    return pool.filter((u) => u.id !== idUsuarioEditando);
  };

  // =====================================================================
  // 🆕 FUNCIÓN DE DUPLICAR (COPIAR CLASE)
  // =====================================================================
  const manejarDuplicacion = async (idMateria) => {
    const materiaOriginal = materias.find((m) => m.id === idMateria);
    if (!materiaOriginal) return;

    const pool = obtenerPoolUsuarios();

    // Buscamos amigos que tengan EXACTAMENTE esta misma clase (para duplicárselas a ellos también)
    const afectados = pool.filter((u) =>
      u.materias?.some(
        (mat) =>
          mat.salon.toLowerCase() === materiaOriginal.salon.toLowerCase() &&
          mat.rango === materiaOriginal.bloque &&
          materiaOriginal.dias.includes(mat.dia),
      ),
    );

    let duplicarAmigos = false;
    if (afectados.length > 0) {
      const nombres = afectados
        .map((a) => (a.esYo ? "TÚ" : a.nombreUsuario))
        .join(", ");
      duplicarAmigos = confirm(
        `📢 DUPLICAR CLASE\n\n` +
          `Vas a crear una copia de "${materiaOriginal.nombre}".\n` +
          `${nombres} también tienen esta clase.\n\n` +
          `¿Quieres crearles una copia a ellos también? (Útil para dividir horarios)`,
      );
    }

    if (duplicarAmigos) {
      let count = 0;
      for (const u of afectados) {
        // Encontramos las materias originales del amigo para clonarlas
        // OJO: Un amigo podría tener esta clase desglosada en varios objetos en su DB,
        // así que buscamos las coincidencias y las duplicamos.
        const nuevasMaterias = [...u.materias];

        // Buscamos las entradas que coinciden con la materia que estamos copiando
        const coincidencias = u.materias.filter(
          (mat) =>
            mat.salon.toLowerCase() === materiaOriginal.salon.toLowerCase() &&
            mat.rango === materiaOriginal.bloque &&
            materiaOriginal.dias.includes(mat.dia),
        );

        // Las pusheamos de nuevo (duplicar)
        coincidencias.forEach((c) => {
          nuevasMaterias.push({ ...c }); // Copia exacta
        });

        await db.horarios.update(u.id, { materias: nuevasMaterias });
        count++;
      }
      alert(`✅ Se duplicó la clase para ${count} persona(s).`);
    }

    // Duplicar LOCALMENTE
    const copia = {
      ...materiaOriginal,
      id: Date.now(), // Nuevo ID para que sea independiente
    };
    // La insertamos justo después de la original para que se vea ordenado
    const indice = materias.findIndex((m) => m.id === idMateria);
    const nuevasMateriasLocal = [...materias];
    nuevasMateriasLocal.splice(indice + 1, 0, copia);

    setMaterias(nuevasMateriasLocal);
  };

  // --- RESTO DE FUNCIONES (IGUAL QUE ANTES) ---

  const verificarCambioSalon = async (idMateria, nuevoSalon) => {
    const m = materias.find((mat) => mat.id === idMateria);
    if (!m || !salonTemp || salonTemp === nuevoSalon) return;
    const viejoSalon = salonTemp.trim();
    const pool = obtenerPoolUsuarios();
    const afectados = pool.filter((u) =>
      u.materias?.some(
        (mat) =>
          mat.salon.toLowerCase() === viejoSalon.toLowerCase() &&
          mat.rango === m.bloque &&
          m.dias.includes(mat.dia),
      ),
    );
    if (afectados.length > 0) {
      const nombres = afectados
        .map((a) => (a.esYo ? "TÚ" : a.nombreUsuario))
        .join(", ");
      if (
        confirm(
          `📢 CAMBIO DE SALÓN\n\n${nombres} están en el salón anterior (${viejoSalon}).\n¿Moverlos al nuevo salón (${nuevoSalon}) también?`,
        )
      ) {
        for (const u of afectados) {
          const nuevas = u.materias.map((mat) => {
            if (
              mat.salon.toLowerCase() === viejoSalon.toLowerCase() &&
              mat.rango === m.bloque &&
              m.dias.includes(mat.dia)
            ) {
              return { ...mat, salon: nuevoSalon };
            }
            return mat;
          });
          await db.horarios.update(u.id, { materias: nuevas });
        }
        alert("✅ Amigos movidos al nuevo salón.");
      }
    }
    setSalonTemp("");
  };

  const verificarCambioHora = async (idMateria, nuevaHora) => {
    const m = materias.find((mat) => mat.id === idMateria);
    if (!m || !bloqueTemp || bloqueTemp === nuevaHora) return;
    const viejaHora = bloqueTemp;
    const pool = obtenerPoolUsuarios();
    const afectados = pool.filter((u) =>
      u.materias?.some(
        (mat) =>
          mat.salon.toLowerCase() === m.salon.toLowerCase() &&
          mat.rango === viejaHora &&
          m.dias.includes(mat.dia),
      ),
    );
    if (afectados.length > 0) {
      const nombres = afectados
        .map((a) => (a.esYo ? "TÚ" : a.nombreUsuario))
        .join(", ");
      if (
        confirm(
          `📢 CAMBIO DE HORA\n\n${nombres} tienen esta clase a las ${viejaHora}.\n¿Moverlos a la nueva hora (${nuevaHora}) también?`,
        )
      ) {
        for (const u of afectados) {
          const nuevas = u.materias.map((mat) => {
            if (
              mat.salon.toLowerCase() === m.salon.toLowerCase() &&
              mat.rango === viejaHora &&
              m.dias.includes(mat.dia)
            ) {
              return { ...mat, rango: nuevaHora };
            }
            return mat;
          });
          await db.horarios.update(u.id, { materias: nuevas });
        }
        alert("✅ Amigos movidos de hora.");
      }
    }
    setBloqueTemp("");
  };

  const manejarToggleDia = async (mId, dia) => {
    const materia = materias.find((m) => m.id === mId);
    if (materia.dias.includes(dia)) {
      const pool = obtenerPoolUsuarios();
      const afectados = pool.filter((u) =>
        u.materias?.some(
          (mat) =>
            mat.dia === dia &&
            mat.rango === materia.bloque &&
            mat.salon.toLowerCase() === materia.salon.toLowerCase(),
        ),
      );
      if (afectados.length > 0) {
        const nombres = afectados
          .map((a) => (a.esYo ? "TÚ" : a.nombreUsuario))
          .join(", ");
        if (
          confirm(
            `📢 QUITAR DÍA\n\nVas a dejar de ir el ${dia.toUpperCase()}.\n${nombres} también van ese día.\n\n¿Quitarles el ${dia} a ellos también?`,
          )
        ) {
          for (const u of afectados) {
            const nuevas = u.materias.filter(
              (mat) =>
                !(
                  mat.dia === dia &&
                  mat.rango === materia.bloque &&
                  mat.salon.toLowerCase() === materia.salon.toLowerCase()
                ),
            );
            await db.horarios.update(u.id, { materias: nuevas });
          }
          alert(`✅ Se eliminó el ${dia} para tus amigos.`);
        }
      }
    }
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

  const manejarEliminacionTotal = async (idMateria) => {
    const materia = materias.find((m) => m.id === idMateria);
    if (!materia) return;
    const pool = obtenerPoolUsuarios();
    const afectados = pool.filter((u) =>
      u.materias?.some(
        (mat) =>
          mat.salon.toLowerCase() === materia.salon.toLowerCase() &&
          mat.rango === materia.bloque &&
          materia.dias.includes(mat.dia),
      ),
    );
    let borrarAmigos = false;
    if (afectados.length > 0) {
      const nombres = afectados
        .map((a) => (a.esYo ? "TÚ" : a.nombreUsuario))
        .join(", ");
      borrarAmigos = confirm(
        `📢 BORRAR MATERIA\n\nEstás borrando esta clase por completo.\n${nombres} también la tienen.\n\n¿Borrársela a ellos también?`,
      );
    }
    if (borrarAmigos) {
      for (const u of afectados) {
        const nuevas = u.materias.filter(
          (mat) =>
            !(
              mat.salon.toLowerCase() === materia.salon.toLowerCase() &&
              mat.rango === materia.bloque &&
              materia.dias.includes(mat.dia)
            ),
        );
        await db.horarios.update(u.id, { materias: nuevas });
      }
      alert("✅ Materia eliminada de todos los amigos afectados.");
    }
    setMaterias(materias.filter((x) => x.id !== idMateria));
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
    // Redirigimos al manejador inteligente
    manejarToggleDia(mId, dia);
  };

  const obtenerGenteEnClase = (dia, bloque, salonActual) => {
    if (!salonActual) return [];
    const pool = obtenerPoolUsuarios();
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
            {/* --- CONTROLES SUPERIORES (BORRAR Y COPIAR) --- */}
            <div className="absolute top-3 right-3 flex gap-2">
              {/* BOTÓN COPIAR */}
              <button
                onClick={() => manejarDuplicacion(m.id)}
                className="text-gray-600 hover:text-tec-blue transition-colors"
                title="Duplicar materia (Dividir horario)"
              >
                <Copy size={14} />
              </button>

              {/* BOTÓN BORRAR */}
              <button
                onClick={() => manejarEliminacionTotal(m.id)}
                className="text-gray-600 hover:text-red-500 transition-colors"
                title="Borrar materia"
              >
                <Trash2 size={14} />
              </button>
            </div>

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

              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                <MapPin size={12} className="text-tec-blue" />
                <input
                  placeholder="Salón..."
                  value={m.salon}
                  onFocus={(e) => setSalonTemp(e.target.value)}
                  onBlur={(e) => verificarCambioSalon(m.id, e.target.value)}
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

            {/* VISUALIZACIÓN DE GENTE */}
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
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                            {u.esYo ? "TÚ" : u.nombreUsuario}
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
                onFocus={() => setBloqueTemp(m.bloque)}
                onChange={(e) => {
                  const nuevaHora = e.target.value;
                  verificarCambioHora(m.id, nuevaHora);
                  actualizarMateria(m.id, "bloque", nuevaHora);
                }}
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
