import Dexie from "dexie";

export const db = new Dexie("ITCM_Horarios_DB");

// Definimos las tablas
// perfil: guarda tus datos (nombre, control)
// horarios: guarda los horarios tuyos y de amigos
db.version(1).stores({
  perfil: "++id, nombre, control",
  horarios: "++id, nombreUsuario, esPrincipal",
});
