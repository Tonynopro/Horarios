// lib/parser.js

/**
 * Transforma el texto CSV del horario en un objeto estructurado.
 * Incluye validación estricta de encabezados y formato.
 */
export const transformarCSV = (csvText, nombreUsuario) => {
  if (!csvText) throw new Error("El archivo está vacío");

  const lineas = csvText.trim().split("\n");

  // VALIDACIÓN ESTRICTA DE ENCABEZADOS
  // Eliminamos caracteres invisibles como \r (comunes en archivos creados en Windows)
  const encabezadoEsperado = "Hora,Lunes,Martes,Miércoles,Jueves,Viernes";
  const primeraLinea = lineas[0].replace(/[\r\n]/g, "").trim();

  if (primeraLinea !== encabezadoEsperado) {
    throw new Error(
      "Archivo no válido: Los encabezados deben ser exactamente: Hora,Lunes,Martes,Miércoles,Jueves,Viernes"
    );
  }

  const materias = [];
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];

  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i].replace(/[\r\n]/g, "").trim();
    if (!fila) continue;

    const columnas = fila.split(",");

    // Validamos que la fila tenga las 6 columnas (Hora + 5 días)
    if (columnas.length < 6) continue;

    const rangoHora = columnas[0]?.trim();

    diasSemana.forEach((dia, index) => {
      const celda = columnas[index + 1]?.trim();

      if (celda && celda !== "") {
        // Regex para separar "Nombre de Materia (Salón)"
        // Captura todo antes del paréntesis y lo que esté dentro
        const regexSalon = /(.*)\((.*)\)/;
        const match = celda.match(regexSalon);

        materias.push({
          dia,
          rango: rangoHora,
          nombre: match ? match[1].trim() : celda,
          salon: match ? match[2].trim() : "S/N",
          // Extraemos inicio y fin para cálculos lógicos (ej: "08:00")
          inicio: rangoHora.split("-")[0].trim(),
          fin: rangoHora.split("-")[1].trim(),
        });
      }
    });
  }

  if (materias.length === 0) {
    throw new Error(
      "Archivo no válido: No se encontraron clases en el documento."
    );
  }

  return {
    nombreUsuario,
    materias,
    fechaCreacion: new Date().toISOString(),
  };
};

/**
 * Determina qué clase está ocurriendo ahora mismo basado en el horario.
 */
export const obtenerClaseActual = (materias) => {
  if (!materias || materias.length === 0) return null;

  const ahora = new Date();
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

    const [hInicio, mInicio] = m.inicio.split(":").map(Number);
    const [hFin, mFin] = m.fin.split(":").map(Number);

    const tiempoInicio = hInicio * 100 + mInicio;
    const tiempoFin = hFin * 100 + mFin;

    return tiempoActual >= tiempoInicio && tiempoActual < tiempoFin;
  });
};

/**
 * Analiza el horario para determinar si el usuario aún no llega, está libre o ya salió.
 */
export const obtenerEstadoDia = (materias, diaHoy) => {
  if (!materias || materias.length === 0)
    return { estado: "Sin clases", detalle: "No hay materias" };

  const ahora = new Date();
  const tiempoActual = ahora.getHours() * 100 + ahora.getMinutes();

  const clasesHoy = materias
    .filter((m) => m.dia === diaHoy)
    .sort((a, b) => {
      const inicioA = parseInt(a.inicio.replace(":", ""));
      const inicioB = parseInt(b.inicio.replace(":", ""));
      return inicioA - inicioB;
    });

  if (clasesHoy.length === 0)
    return { estado: "Libre", detalle: "Sin clases hoy" };

  const primeraClase = clasesHoy[0];
  const ultimaClase = clasesHoy[clasesHoy.length - 1];

  const tiempoEntrada = parseInt(primeraClase.inicio.replace(":", ""));
  const tiempoSalida = parseInt(ultimaClase.fin.replace(":", ""));

  if (tiempoActual < tiempoEntrada) {
    return {
      estado: "Aún no llega",
      detalle: `Entra a las ${primeraClase.inicio}`,
    };
  }

  if (tiempoActual >= tiempoSalida) {
    return { estado: "Ya salió", detalle: `Salió a las ${ultimaClase.fin}` };
  }

  return { estado: "Hora libre", detalle: "En el Tec" };
};

/**
 * Compara tu estado actual con el de un amigo.
 */
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
    ambosLibres:
      !miClase &&
      !suClase &&
      obtenerEstadoDia(misMaterias, diaHoy).estado === "Hora libre" &&
      obtenerEstadoDia(materiasAmigo, diaHoy).estado === "Hora libre",
  };
};
