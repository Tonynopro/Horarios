"use client";
import React from "react";
import * as Lucide from "lucide-react";

export default function GuiaCSV({ onClose }) {
  const ejemploHorario = [
    {
      hora: "07:00 - 08:00",
      l: "Cálculo (F1) - Ing. García",
      m: "",
      mi: "Cálculo (F1) - Ing. García",
      j: "",
      v: "Cálculo (F1) - Ing. García",
    },
    {
      hora: "08:00 - 09:00",
      l: "IA (LCA)",
      m: "IA (LCA) - Dr. Smith",
      mi: "IA (LCA)",
      j: "IA (LCA) - Dr. Smith",
      v: "",
    },
    {
      hora: "09:00 - 10:00",
      l: "",
      m: "Química (L1)",
      mi: "",
      j: "Química (L1)",
      v: "",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-card-bg w-full max-w-4xl rounded-[3rem] border border-white/10 p-6 md:p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 text-tec-blue">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-tec-blue/10 flex items-center justify-center border border-tec-blue/20">
              <Lucide.Info size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                Guía de Importación{" "}
                <span className="text-tec-blue text-sm">v2.1</span>
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                Estandarización de Datos & Profesores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all text-white border border-white/5"
          >
            <Lucide.X size={20} />
          </button>
        </div>

        <div className="space-y-10 text-left">
          {/* PASO 1: ESTRUCTURA */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-tec-blue text-white px-3 py-1 rounded-full text-[10px] font-black italic">
                ESTRUCTURA
              </span>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Lucide.Table size={14} /> Diseño en Hoja de Cálculo
              </p>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-white/[0.02] p-1 shadow-inner">
              <table className="w-full text-[10px] font-bold min-w-[700px] text-center border-separate border-spacing-1">
                <thead>
                  <tr className="bg-tec-blue text-white uppercase italic">
                    <th className="p-3 rounded-xl border border-white/10">
                      Hora
                    </th>
                    <th className="p-3 rounded-xl border border-white/10">
                      Lunes
                    </th>
                    <th className="p-3 rounded-xl border border-white/10">
                      Martes
                    </th>
                    <th className="p-3 rounded-xl border border-white/10">
                      Miércoles
                    </th>
                    <th className="p-3 rounded-xl border border-white/10">
                      Jueves
                    </th>
                    <th className="p-3 rounded-xl border border-white/10">
                      Viernes
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {ejemploHorario.map((row, i) => (
                    <tr key={i}>
                      <td className="p-3 bg-white/5 rounded-xl text-white font-mono border border-white/5">
                        {row.hora}
                      </td>
                      {[row.l, row.m, row.mi, row.j, row.v].map((val, idx) => (
                        <td
                          key={idx}
                          className={`p-3 rounded-xl border border-white/5 ${val ? "text-tec-blue bg-tec-blue/5 shadow-sm" : "text-gray-800 italic font-normal"}`}
                        >
                          {val || "vacío"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PASO 2: TEXTO PLANO */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-white/5 text-white px-3 py-1 rounded-full text-[10px] font-black italic">
                FORMATO CSV
              </span>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Lucide.FileType size={14} /> Vista de exportación (.csv)
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 font-mono text-[11px] text-tec-blue/80 leading-relaxed overflow-x-auto shadow-inner relative group">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                <Lucide.Code size={16} className="text-white" />
              </div>
              Hora,Lunes,Martes,Miércoles,Jueves,Viernes
              <br />
              07:00 - 08:00,Cálculo (F1) - Ing. García,,Cálculo (F1) - Ing.
              García,,
              <br />
              08:00 - 09:00,IA (LCA),IA (LCA) - Dr. Smith,IA (LCA),IA (LCA) -
              Dr. Smith,
            </div>
          </div>

          {/* REGLAS Y PROFESORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* REGLAS DE ORO */}
            <div className="bg-tec-blue/5 p-6 rounded-[2.5rem] border border-tec-blue/20">
              <p className="text-tec-blue font-black text-xs uppercase mb-5 tracking-widest flex items-center gap-2">
                <Lucide.CheckCircle2 size={16} /> REGLAS DE ORO
              </p>
              <ul className="space-y-4">
                {[
                  {
                    t: "Materia y salón:",
                    d: "Deben ir juntos en la misma celda.",
                  },
                  { t: "Salón:", d: "Siempre debe ir entre paréntesis: (A1)." },
                  {
                    t: "Profesor:",
                    d: "Se añade después de un guion corto: - Nombre.",
                  },
                  { t: "Comas:", d: "No uses comas dentro de las celdas." },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-tec-blue mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white font-black uppercase leading-none mb-1">
                        {item.t}
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">
                        {item.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* INFO PROFESORES */}
            <div className="bg-white/[0.03] p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-between">
              <div>
                <p className="text-white font-black text-xs uppercase mb-5 tracking-widest flex items-center gap-2">
                  <Lucide.GraduationCap
                    size={16}
                    className="text-accent-purple"
                  />{" "}
                  GESTIÓN DE PROFESORES
                </p>
                <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                    El campo de profesor es{" "}
                    <span className="text-tec-blue font-black underline">
                      completamente opcional
                    </span>
                    . Si el parser no detecta un guion despues del salón,
                    simplemente dejará el campo vacío.
                  </p>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">
                      Ejemplos válidos:
                    </p>
                    <code className="text-[9px] text-accent-purple block">
                      Fundamentos (L1) - Ing. Ramos
                    </code>
                    <code className="text-[9px] text-gray-400 block mt-1">
                      Fundamentos (L1)
                    </code>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-yellow-500/50">
                <Lucide.AlertCircle size={14} />
                <p className="text-[8px] font-black uppercase italic">
                  Recuerda usar coma (,) como delimitador de archivo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN INFERIOR CERRAR */}
        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all border border-white/5"
        >
          Entendido, cerrar guía
        </button>
      </div>
    </div>
  );
}
