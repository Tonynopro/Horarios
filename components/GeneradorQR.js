"use client";
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Check } from "lucide-react";

export default function GeneradorQR({ horario, onClose }) {
  const [descargado, setDescargado] = useState(false);

  // PAYLOAD MÍNIMO: Solo materias. Formato: Materia,Salón,Día,Rango;...
  const payload = (() => {
    const dMap = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5 };
    return horario.materias
      .slice(0, 12)
      .map((m) =>
        [
          m.nombre.substring(0, 10),
          m.salon.substring(0, 4),
          dMap[m.dia] || 1,
          m.rango.replace(/\s/g, ""),
        ].join(","),
      )
      .join(";");
  })();

  const descargarPNG = () => {
    const svg = document.getElementById("qr-final-download");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.imageSmoothingEnabled = false;
      // Margen generoso de 150px
      ctx.drawImage(img, 150, 150, 700, 700);

      const link = document.createElement("a");
      link.download = `Pass_${horario.nombreUsuario}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setDescargado(true);
      setTimeout(() => setDescargado(false), 2000);
    };
    img.src = "data:image/svg+xml;base64," + svg64;
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80">
      <div className="bg-card-bg border border-white/10 rounded-[3rem] p-8 w-full max-w-sm text-center relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-black uppercase italic text-tec-blue mb-6">
          Network Pass
        </h3>

        <div className="bg-white p-6 rounded-3xl inline-block mb-6 border-4 border-white shadow-xl">
          <QRCodeSVG
            id="qr-final-download"
            value={payload}
            size={250}
            level="L"
          />
        </div>

        <p className="text-white font-black text-sm uppercase mb-6 truncate">
          {horario.nombreUsuario}
        </p>

        <button
          onClick={descargarPNG}
          className="w-full bg-tec-blue text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          {descargado ? <Check size={16} /> : <Download size={16} />} Descargar
          QR
        </button>
      </div>
    </div>
  );
}
