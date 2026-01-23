"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

function ImportarHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("cargando");

  useEffect(() => {
    const procesarImportacion = async () => {
      const dataBase64 = searchParams.get("data");
      const dataRaw = searchParams.get("raw");

      let decodedString = "";
      try {
        if (dataRaw) {
          decodedString = dataRaw;
        } else if (dataBase64) {
          decodedString = decodeURIComponent(escape(atob(dataBase64)));
        } else {
          return setStatus("error");
        }

        const diasRev = {
          lu: "lunes",
          ma: "martes",
          mi: "miercoles",
          ju: "jueves",
          vi: "viernes",
          1: "lunes",
          2: "martes",
          3: "miercoles",
          4: "jueves",
          5: "viernes",
        };

        let nombreFinal = "Amigo de Red";
        let materiasFinales = [];

        // --- CASO 1: FORMATO ULTRA-FLAT (Nombre|Materias) ---
        if (decodedString.includes("|")) {
          const [nombreUser, materiasRaw] = decodedString.split("|");
          nombreFinal = nombreUser || "Amigo de Red";

          materiasFinales = materiasRaw.split(";").map((m) => {
            const [nombre, salon, diaAbrev, rango] = m.split(",");
            const rangoLimpio = (rango || "07:00-08:00").replace(/\s/g, "");
            const [ini, fin] = rangoLimpio.split("-");
            return {
              nombre: nombre || "Clase",
              salon: salon || "S/N",
              profesor: "",
              dia: diasRev[String(diaAbrev).toLowerCase()] || "lunes",
              rango: `${ini || "07:00"} - ${fin || "08:00"}`,
              inicio: ini || "07:00",
              fin: fin || "08:00",
            };
          });
        }
        // --- CASO 2: FORMATO SOLO MATERIAS (Materia,Salon...) ---
        else if (decodedString.includes(",") && !decodedString.includes("{")) {
          materiasFinales = decodedString.split(";").map((m) => {
            const [nombre, salon, diaNum, rango] = m.split(",");
            const [ini, fin] = (rango || "07:00-08:00").split("-");
            return {
              nombre: nombre || "Clase",
              salon: salon || "S/N",
              profesor: "",
              dia: diasRev[diaNum] || "lunes",
              rango: `${ini} - ${fin}`,
              inicio: ini,
              fin: fin,
            };
          });
        }
        // --- CASO 3: FORMATO JSON (Antiguo) ---
        else {
          const data = JSON.parse(decodedString);
          nombreFinal = data.n || "Nuevo Amigo";
          materiasFinales = (data.m || []).map((m) => {
            if (Array.isArray(m)) {
              const [nombre, salon, diaAbrev, rango] = m;
              const [ini, fin] = (rango || "07:00-08:00").split("-");
              return {
                nombre: nombre || "Clase",
                salon: salon || "S/N",
                profesor: "",
                dia: diasRev[String(diaAbrev).toLowerCase()] || "lunes",
                rango: `${ini} - ${fin}`,
                inicio: ini,
                fin: fin,
              };
            }
            return {
              nombre: m.n || m.nombre || "Clase",
              salon: m.s || m.salon || "S/N",
              profesor: m.p || m.profesor || "",
              dia: diasRev[String(m.d || m.dia).toLowerCase()] || "lunes",
              rango: m.r || m.rango || "07:00-08:00",
              inicio: (m.r || m.rango || "07:00-08:00").split("-")[0].trim(),
              fin: (m.r || m.rango || "07:00-08:00").split("-")[1] || "08:00",
            };
          });
        }

        if (materiasFinales.length === 0)
          throw new Error("No se encontraron materias");

        await db.horarios.add({
          id: `qr_${Date.now()}`,
          nombreUsuario: nombreFinal,
          esPrincipal: "false",
          materias: materiasFinales,
        });

        setStatus("exito");
        setTimeout(() => router.push("/amigos"), 1500);
      } catch (e) {
        console.error("Fallo crítico:", e);
        setStatus("error");
      }
    };
    procesarImportacion();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-10">
      <div className="bg-card-bg p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center space-y-6 max-w-sm">
        {status === "cargando" && (
          <Loader2 className="animate-spin text-tec-blue mx-auto" size={48} />
        )}
        {status === "exito" && (
          <CheckCircle2 className="text-green-500 mx-auto" size={48} />
        )}
        {status === "error" && (
          <AlertCircle className="text-red-500 mx-auto" size={48} />
        )}
        <h2 className="text-xl font-black uppercase italic text-white">
          {status === "cargando"
            ? "Sincronizando..."
            : status === "exito"
              ? "¡Agregado!"
              : "Error de QR"}
        </h2>
        {status === "error" && (
          <button
            onClick={() => router.push("/amigos")}
            className="text-tec-blue text-xs font-bold uppercase underline"
          >
            Volver
          </button>
        )}
      </div>
    </div>
  );
}

export default function ImportarPage() {
  return (
    <Suspense>
      <ImportarHandler />
    </Suspense>
  );
}
