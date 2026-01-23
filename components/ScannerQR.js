"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  X,
  Image as ImageIcon,
  Camera,
  Loader2,
  SearchCheck,
} from "lucide-react";

export default function ScannerQR({ onScanSuccess, onClose }) {
  const [mode, setMode] = useState("camera");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  const killScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    const container = document.getElementById("qr-reader-container");
    if (container) container.innerHTML = "";
  };

  useEffect(() => {
    if (mode === "camera") {
      const html5QrCode = new Html5Qrcode("qr-reader-container");
      scannerRef.current = html5QrCode;
      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 15, qrbox: 250 },
          (text) => {
            killScanner().then(() => onScanSuccess(text));
          },
          () => {}, // Errores silenciosos de búsqueda
        )
        .catch(() => {});
    }
    return () => {
      killScanner();
    };
  }, [mode]);

  // Busca la función processFile dentro de ScannerQR.js y reemplázala:
  const processFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const fileScanner = new Html5Qrcode("file-helper");
    try {
      // Intentamos leer el texto. Usamos 'false' para un escaneo profundo.
      const result = await fileScanner.scanFile(file, false);
      onScanSuccess(result);
    } catch (err) {
      // CORRECCIÓN: Convertimos el error a String antes de usar includes
      const errorMessage = String(err || "");

      if (errorMessage.includes("No MultiFormat Readers")) {
        alert(
          "No se encontró ningún código QR en la imagen. Intenta con otra foto.",
        );
      } else {
        // Si detectó algo pero no pudo leerlo, probamos el modo inverso automáticamente
        try {
          const resultInverted = await fileScanner.scanFile(file, true);
          onScanSuccess(resultInverted);
        } catch (innerErr) {
          alert(
            "QR detectado pero ilegible. Asegúrate de que no tenga reflejos y se vea completo.",
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/95">
      <div className="bg-card-bg border border-white/10 rounded-[3rem] p-6 w-full max-w-sm relative shadow-2xl">
        <button
          onClick={() => killScanner().then(onClose)}
          className="absolute top-6 right-6 text-gray-500 hover:text-white z-50"
        >
          <X size={24} />
        </button>

        <h3 className="text-center text-white font-black uppercase italic mb-6 tracking-tighter">
          Network Scanner
        </h3>

        {mode === "camera" ? (
          <div
            id="qr-reader-container"
            className="overflow-hidden rounded-3xl border border-white/5 bg-black aspect-square"
          ></div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-tec-blue/20 rounded-3xl bg-white/5 cursor-pointer relative">
            {loading ? (
              <Loader2 className="animate-spin text-tec-blue" size={40} />
            ) : (
              <SearchCheck className="text-tec-blue" size={40} />
            )}
            <p className="text-[10px] text-gray-400 font-black uppercase mt-2">
              {loading ? "Analizando píxeles..." : "Subir archivo"}
            </p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={processFile}
            />
          </label>
        )}

        <div id="file-helper" className="hidden"></div>
        <button
          onClick={() => setMode(mode === "camera" ? "file" : "camera")}
          className="w-full mt-6 bg-white/5 py-4 rounded-2xl text-[10px] font-black uppercase text-white border border-white/5"
        >
          {mode === "camera" ? "Probar con Foto de Galería" : "Volver a Cámara"}
        </button>
      </div>
    </div>
  );
}
