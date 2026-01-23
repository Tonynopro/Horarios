import Dexie from "dexie";

export const db = new Dexie("ITCM_Horarios_DB");

/**
 * ESQUEMA DE BASE DE DATOS
 * Versión 2: Se añade 'formatoHora' al perfil para personalización visual.
 */
db.version(2)
  .stores({
    perfil: "++id, nombre, control, formatoHora",
    horarios: "++id, nombreUsuario, esPrincipal",
  })
  .upgrade(async (tx) => {
    // Al subir de versión, nos aseguramos de que los perfiles existentes
    // tengan un formato por defecto (24h)
    return tx.perfil.toCollection().modify((p) => {
      if (!p.formatoHora) p.formatoHora = 24;
    });
  });

// Nota: Mantenemos la lógica de almacenamiento local para privacidad total.
