"use client";
import React from "react";
// Cambiamos la forma de importar para que Turbopack no pierda la referencia
import * as Lucide from "lucide-react";

export default function GuiaCSV({ onClose }) {
  const ejemploHorario = [
    {
      hora: "07:00 - 08:00",
      l: "Cálculo (F1)",
      m: "",
      mi: "Cálculo (F1)",
      j: "",
      v: "Cálculo (F1)",
    },
    {
      hora: "08:00 - 09:00",
      l: "IA (LCA)",
      m: "IA (LCA)",
      mi: "IA (LCA)",
      j: "IA (LCA)",
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
    {
      hora: "10:00 - 11:00",
      l: "Redes (L2)",
      m: "Redes (L2)",
      mi: "Redes (L2)",
      j: "Redes (L2)",
      v: "Redes (L2)",
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
            <div className="w-10 h-10 rounded-2xl bg-tec-blue/10 flex items-center justify-center">
              <Lucide.Info size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                Guía de Importación
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                Estandarización de Archivos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all text-white"
          >
            <Lucide.X size={20} />
          </button>
        </div>

        <div className="space-y-10 text-left">
          {/* PASO 1: EXCEL */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-white/5 text-white px-3 py-1 rounded-full text-[10px] font-black italic">
                PASO 01
              </span>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Lucide.Table size={14} /> Diseño en Excel / Hojas de Cálculo
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.02] p-1">
              <table className="w-full text-[10px] font-bold min-w-[600px] text-center border-separate border-spacing-1">
                <thead>
                  <tr className="bg-tec-blue text-white uppercase italic">
                    <th className="p-3 rounded-xl">Hora</th>
                    <th className="p-3 rounded-xl">Lunes</th>
                    <th className="p-3 rounded-xl">Martes</th>
                    <th className="p-3 rounded-xl">Miércoles</th>
                    <th className="p-3 rounded-xl">Jueves</th>
                    <th className="p-3 rounded-xl">Viernes</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {ejemploHorario.map((row, i) => (
                    <tr key={i}>
                      <td className="p-3 bg-white/5 rounded-xl text-white font-mono">
                        {row.hora}
                      </td>
                      <td
                        className={`p-3 rounded-xl border border-white/5 ${row.l ? "text-tec-blue bg-tec-blue/5" : "text-gray-700 italic"}`}
                      >
                        {row.l || "vacío"}
                      </td>
                      <td
                        className={`p-3 rounded-xl border border-white/5 ${row.m ? "text-tec-blue bg-tec-blue/5" : "text-gray-700 italic"}`}
                      >
                        {row.m || "vacío"}
                      </td>
                      <td
                        className={`p-3 rounded-xl border border-white/5 ${row.mi ? "text-tec-blue bg-tec-blue/5" : "text-gray-700 italic"}`}
                      >
                        {row.mi || "vacío"}
                      </td>
                      <td
                        className={`p-3 rounded-xl border border-white/5 ${row.j ? "text-tec-blue bg-tec-blue/5" : "text-gray-700 italic"}`}
                      >
                        {row.j || "vacío"}
                      </td>
                      <td
                        className={`p-3 rounded-xl border border-white/5 ${row.v ? "text-tec-blue bg-tec-blue/5" : "text-gray-700 italic"}`}
                      >
                        {row.v || "vacío"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PASO 2: CSV RAW */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-white/5 text-white px-3 py-1 rounded-full text-[10px] font-black italic">
                PASO 02
              </span>
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <Lucide.FileType size={14} /> Exportar como texto plano (.csv)
              </p>
            </div>

            <div className="bg-black/60 p-6 rounded-2xl border border-white/10 font-mono text-[11px] text-tec-blue leading-relaxed overflow-x-auto">
              Hora,Lunes,Martes,Miércoles,Jueves,Viernes
              <br />
              07:00 - 08:00,Cálculo (F1),,Cálculo (F1),,Cálculo (F1)
              <br />
              08:00 - 09:00,IA (LCA),IA (LCA),IA (LCA),IA (LCA),
              <br />
              09:00 - 10:00,,Química (L1),,Química (L1),
              <br />
              10:00 - 11:00,Redes (L2),Redes (L2),Redes (L2),Redes (L2),Redes
              (L2)
            </div>
          </div>

          {/* CHECKLIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-tec-blue/5 p-6 rounded-[2rem] border border-tec-blue/20">
              <p className="text-tec-blue font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                <Lucide.CheckCircle2 size={14} /> REGLAS DE ORO
              </p>
              <ul className="space-y-3">
                {[
                  "Materia y salón en la misma celda.",
                  "Salón entre paréntesis: (A1).",
                  "Celdas vacías para horas libres.",
                  "No uses comas internas.",
                ].map((txt, i) => (
                  <li
                    key={i}
                    className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-3"
                  >
                    <span className="text-tec-blue font-black">◈</span> {txt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5">
              <p className="text-white font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                <Lucide.AlertCircle size={14} /> IMPORTANTE
              </p>
              <p className="text-[9px] text-yellow-500/80 font-black uppercase italic leading-tight">
                Asegúrate de que el delimitador al guardar en Excel sea COMA (,)
                y no punto y coma (;).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
