/**
 * Convierte una hora individual (HH:MM) a formato 12h.
 * Blindada contra valores nulos durante la carga inicial de Dexie.
 */
const formatearHoraIndividual = (horaStr, formato) => {
  const raw = horaStr || "";
  const f = formato || 24;

  if (f === 24 || f === "24" || typeof raw !== "string" || raw === "") {
    return raw;
  }

  if (raw.indexOf(":") === -1) return raw;

  try {
    const partes = raw.split(":");
    const hStr = partes[0];
    const mStr = partes[1];

    if (hStr === undefined || mStr === undefined) return raw;

    const hInt = parseInt(hStr, 10);
    const mInt = parseInt(mStr, 10);

    if (isNaN(hInt) || isNaN(mInt)) return raw;

    const ampm = hInt >= 12 ? " PM" : " AM";
    let h12 = hInt % 12;
    if (h12 === 0) h12 = 12;

    const hFinal = h12 < 10 ? "0" + h12 : "" + h12;
    const mFinal = mInt < 10 ? "0" + mInt : "" + mInt;

    return hFinal + ":" + mFinal + ampm;
  } catch (e) {
    return raw;
  }
};

/**
 * Transforma un rango completo (ej: "07:00 - 08:00") al formato deseado.
 */
export const formatearRango = (rango, formato) => {
  const rawRango = rango || "";
  const f = formato || 24;

  if (typeof rawRango !== "string" || rawRango === "" || rawRango === "---") {
    return rawRango;
  }

  if (f === 24 || f === "24") return rawRango;

  if (rawRango.indexOf("-") === -1) return rawRango;

  try {
    const sep = rawRango.indexOf(" - ") !== -1 ? " - " : "-";
    const partes = rawRango.split(sep);

    if (partes.length < 2) return rawRango;

    const inicio = partes[0] ? partes[0].trim() : "";
    const fin = partes[1] ? partes[1].trim() : "";

    if (!inicio || !fin) return rawRango;

    const resInicio = formatearHoraIndividual(inicio, f);
    const resFin = formatearHoraIndividual(fin, f);

    return resInicio + " - " + resFin;
  } catch (e) {
    return rawRango;
  }
};

/**
 * Transforma el texto CSV del horario en un objeto estructurado.
 * Ahora detecta opcionalmente al profesor usando el formato: Materia (Salón) - Profesor
 */
export const transformarCSV = (csvText, nombreUsuario) => {
  if (!csvText) throw new Error("El archivo está vacío");

  const lineas = csvText.trim().split("\n");
  const encabezadoEsperado = "Hora,Lunes,Martes,Miércoles,Jueves,Viernes";
  const primeraLinea = (lineas[0] || "").replace(/[\r\n]/g, "").trim();

  if (primeraLinea !== encabezadoEsperado) {
    throw new Error("Archivo no válido: Encabezados incorrectos.");
  }

  const materias = [];
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  for (let i = 1; i < lineas.length; i++) {
    const fila = (lineas[i] || "").replace(/[\r\n]/g, "").trim();
    if (!fila) continue;

    const columnas = fila.split(",");
    if (columnas.length < 6) continue;

    const rangoHora = (columnas[0] || "").trim();

    diasSemana.forEach((dia, index) => {
      const celda = (columnas[index + 1] || "").trim();
      if (celda && celda !== "") {
        /**
         * REGEX EXPLICACIÓN:
         * (.*?)          -> Grupo 1: Nombre de la materia (perezoso)
         * \((.*?)\)      -> Grupo 2: Texto dentro de paréntesis (Salón)
         * (?:\s*-\s*(.*))? -> Grupo 3 (Opcional): Texto después de un guion (Profesor)
         */
        const regexCompleto = /(.*?)\((.*?)\)(?:\s*-\s*(.*))?/;
        const match = celda.match(regexCompleto);

        materias.push({
          dia,
          rango: rangoHora,
          nombre: match ? match[1].trim() : celda,
          salon: match ? match[2].trim() : "S/N",
          profesor: match && match[3] ? match[3].trim() : "",
          inicio: (rangoHora.split("-")[0] || "00:00").trim(),
          fin: (rangoHora.split("-")[1] || "00:00").trim(),
        });
      }
    });
  }

  return { nombreUsuario, materias, fechaCreacion: new Date().toISOString() };
};

/**
 * Determina qué clase está ocurriendo ahora mismo.
 */
// Añadimos 'fechaReferencia' como segundo parámetro, por defecto es la fecha actual
export const obtenerClaseActual = (materias, fechaReferencia = new Date()) => {
  if (!materias || !Array.isArray(materias) || materias.length === 0)
    return null;

  // Usamos la fecha que pasamos por parámetro en lugar de crear una nueva siempre
  const ahora = fechaReferencia;

  const tiempoActual = ahora.getHours() * 100 + ahora.getMinutes();
  const diasTraducidos = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  const diaHoy = diasTraducidos[ahora.getDay()];

  return materias.find((m) => {
    if (m.dia !== diaHoy) return false;
    const pI = (m.inicio || "00:00").split(":");
    const pF = (m.fin || "00:00").split(":");
    const tiempoInicio =
      parseInt(pI[0] || 0, 10) * 100 + parseInt(pI[1] || 0, 10);
    const tiempoFin = parseInt(pF[0] || 0, 10) * 100 + parseInt(pF[1] || 0, 10);

    return tiempoActual >= tiempoInicio && tiempoActual < tiempoFin;
  });
};

/**
 * Analiza el estado del día con soporte para formato 12h/24h.
 */
export const obtenerEstadoDia = (materias, diaHoy, formato) => {
  const f = formato || 24;
  if (!materias || !Array.isArray(materias) || materias.length === 0)
    return { estado: "Sin clases", detalle: "No hay materias" };

  const ahora = new Date();
  const tiempoActual = ahora.getHours() * 100 + ahora.getMinutes();

  const clasesHoy = materias
    .filter((m) => m.dia === diaHoy)
    .sort((a, b) => {
      const inicioA = parseInt((a.inicio || "0").replace(":", ""), 10);
      const inicioB = parseInt((b.inicio || "0").replace(":", ""), 10);
      return inicioA - inicioB;
    });

  if (clasesHoy.length === 0)
    return { estado: "Libre", detalle: "Sin clases hoy" };

  const primeraClase = clasesHoy[0];
  const ultimaClase = clasesHoy[clasesHoy.length - 1];

  const tiempoEntrada = parseInt(
    (primeraClase.inicio || "0").replace(":", ""),
    10,
  );
  const tiempoSalida = parseInt((ultimaClase.fin || "0").replace(":", ""), 10);

  if (tiempoActual < tiempoEntrada) {
    return {
      estado: "Aún no llega",
      detalle: "Entra a las " + formatearHoraIndividual(primeraClase.inicio, f),
    };
  }

  if (tiempoActual >= tiempoSalida) {
    return {
      estado: "Ya salió",
      detalle: "Salió a las " + formatearHoraIndividual(ultimaClase.fin, f),
    };
  }

  return { estado: "Hora libre", detalle: "En el Tec" };
};

export const compararConAmigo = (misMaterias, materiasAmigo) => {
  const ahora = new Date();
  const diasSemana = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  const diaHoy = diasSemana[ahora.getDay()];

  const miClase = obtenerClaseActual(misMaterias);
  const suClase = obtenerClaseActual(materiasAmigo);

  return {
    mismoBloque: miClase && suClase && miClase.rango === suClase.rango,
    mismoSalon: miClase && suClase && miClase.salon === suClase.salon,
    mismoProfesor:
      miClase &&
      suClase &&
      miClase.profesor &&
      miClase.profesor === suClase.profesor,
    ambosLibres:
      !miClase &&
      !suClase &&
      obtenerEstadoDia(misMaterias, diaHoy).estado === "Hora libre" &&
      obtenerEstadoDia(materiasAmigo, diaHoy).estado === "Hora libre",
  };
};
