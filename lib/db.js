import Dexie from "dexie";

export const db = new Dexie("ITCM_Horarios_DB");

/**
 * ESQUEMA DE BASE DE DATOS
 * Versión 3: Se añade la tabla 'grupos' para organizar amigos.
 */
db.version(3)
  .stores({
    perfil: "++id, nombre, control, formatoHora",
    horarios: "++id, nombreUsuario, esPrincipal",
    grupos: "++id, nombre", // Almacenará { nombre: string, integrantes: [id_amigo1, id_amigo2] }
  })
  .upgrade(async (tx) => {
    // Si algún usuario viene de versiones muy viejas, aseguramos el formato de hora
    return tx.perfil.toCollection().modify((p) => {
      if (!p.formatoHora) p.formatoHora = 24;
    });
  });

// Nota: Mantenemos la lógica de almacenamiento local para privacidad total.
