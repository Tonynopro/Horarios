"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export default function ImportarArchivoPage() {
  const router = useRouter();

  useEffect(() => {
    if ("launchQueue" in window) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files.length) return;

        for (const fileHandle of launchParams.files) {
          try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const data = JSON.parse(content);

            // Si el archivo trae una lista (como la que pasaste) o uno solo
            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
              // Limpiamos el ID original para evitar conflictos y forzamos esPrincipal: false
              const { id, ...datosSinId } = item;
              await db.horarios.add({
                ...datosSinId,
                id: `fdo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                esPrincipal: "false",
              });
            }

            router.push("/config?status=fdo_success");
          } catch (e) {
            console.error("Fallo al abrir .fdo:", e);
            alert("El archivo .fdo está dañado o no es válido.");
            router.push("/amigos");
          }
        }
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="p-10 bg-card-bg border border-white/10 rounded-[3rem] text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 border-4 border-tec-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter">
          Abriendo archivo .FDO
        </h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase">
          Sincronizando con Network...
        </p>
      </div>
    </div>
  );
}
