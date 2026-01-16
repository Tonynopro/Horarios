"use client";
import { useState } from "react";
import {
  X,
  Plus,
  Save,
  Clock,
  Trash2,
  AlertCircle,
  Check,
  BookOpen,
  MapPin,
} from "lucide-react";

export default function EditorHorarioManual({
  onSave,
  onCancel,
  nombreInicial = "",
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [materias, setMaterias] = useState([]); // Lista de objetos {id, nombre, salon, bloque, dias: []}

  const bloquesTec = [
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
  ];
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  const agregarMateria = () => {
    setMaterias([
      ...materias,
      {
        id: Date.now(),
        nombre: "",
        salon: "",
        bloque: bloquesTec[1], // Empieza en 8:00 por defecto
        dias: [],
      },
    ]);
  };

  const actualizarMateria = (id, campo, valor) => {
    setMaterias(
      materias.map((m) => (m.id === id ? { ...m, [campo]: valor } : m))
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
      })
    );
  };

  const validarYGuardar = () => {
    if (!nombre.trim()) return alert("Escribe el nombre del perfil");
    if (materias.length === 0) return alert("Agrega al menos una materia");

    const materiasFinales = [];
    const ocupados = new Set(); // Para validar que no choquen horas

    for (const m of materias) {
      if (!m.nombre.trim() || m.dias.length === 0) {
        alert(`Faltan datos en la materia: ${m.nombre || "Sin nombre"}`);
        return;
      }

      const [inicio, fin] = m.bloque.split("-");

      for (const dia of m.dias) {
        const key = `${m.bloque}-${dia}`;
        if (ocupados.has(key)) {
          alert(`¡Choque! Tienes dos materias el ${dia} a las ${m.bloque}`);
          return;
        }
        ocupados.add(key);

        materiasFinales.push({
          nombre: m.nombre.trim(),
          salon: m.salon.trim() || "S/N",
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
      {/* HEADER */}
      <header className="flex justify-between items-start mb-6 shrink-0">
        <div className="space-y-1 flex-1 pr-4">
          <h2 className="text-xl font-black uppercase italic text-white leading-none">
            Editor Manual
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

      {/* CONTENIDO CON SCROLL */}
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

            {/* Inputs de texto */}
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
                  onChange={(e) =>
                    actualizarMateria(m.id, "salon", e.target.value)
                  }
                  className="bg-transparent text-[10px] font-bold text-white outline-none w-full"
                />
              </div>
            </div>

            {/* Selector de Bloque */}
            <div className="flex items-center gap-2 bg-tec-blue/10 p-2 rounded-xl border border-tec-blue/20">
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

            {/* Selector de Días */}
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

        {/* Botón agregar más */}
        <button
          onClick={agregarMateria}
          className="w-full py-4 border-2 border-dashed border-white/5 rounded-3xl text-gray-500 flex items-center justify-center gap-2 hover:bg-white/5 hover:text-tec-blue transition-all font-black text-[10px] uppercase"
        >
          <Plus size={16} /> Agregar Materia
        </button>
      </div>

      {/* FOOTER */}
      <footer className="mt-6 shrink-0 space-y-3">
        <button
          onClick={validarYGuardar}
          className="w-full bg-tec-blue hover:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> Guardar Perfil
        </button>
        <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[8px] font-bold uppercase tracking-widest">
          <AlertCircle size={10} /> Verificando choques de horario
        </div>
      </footer>
    </div>
  );
}
