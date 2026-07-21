import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../services/usuarioService.js";
import usuarioRepository from "../repositories/usuarioRepository.js";
import { SesionUsuario } from "../models/seguridad.js";

export const verificarToken = async (req, res, next) => {
  const encabezado = req.headers.authorization;
  if (!encabezado?.startsWith("Bearer ")) return res.status(401).json({ error: "Token no proporcionado" });
  try {
    const decoded = jwt.verify(encabezado.slice(7), JWT_SECRET);
    if (decoded.tipo !== "access" || !decoded.sid) return res.status(401).json({ error: "Token inválido" });
    const sesion = await SesionUsuario.findOne({ where: { id: decoded.sid, usuarioId: decoded.id, revocadaEn: null } });
    if (!sesion || new Date(sesion.expiraEn) <= new Date()) return res.status(401).json({ error: "Sesión cerrada o expirada" });
    const usuario = await usuarioRepository.obtenerPorId(decoded.id);
    if (!usuario?.activo) return res.status(401).json({ error: "Usuario no disponible" });
    await sesion.update({ ultimoAccesoEn: new Date() });
    req.usuario = decoded;
    req.usuarioModelo = usuario;
    return next();
  } catch (error) { return res.status(401).json({ error: error.name === "TokenExpiredError" ? "Token expirado" : "Token inválido" }); }
};

export const verificarPermiso = (...permisos) => (req, res, next) => {
  const disponibles = req.usuario?.permisos || [];
  if (disponibles.includes("*") || permisos.some((permiso) => disponibles.includes(permiso))) return next();
  return res.status(403).json({ error: "Acceso denegado. Permiso insuficiente" });
};

export const verificarRol = (roles = []) => (req, res, next) => roles.some((rol) => req.usuario?.roles?.includes(rol)) ? next() : res.status(403).json({ error: "Acceso denegado" });
export const registrarAcceso = (req, res, next) => next();
