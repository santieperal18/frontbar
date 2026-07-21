import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import usuarioRepository from "../repositories/usuarioRepository.js";
import Restaurante from "../models/restaurante.js";
import { HistorialAcceso, SesionUsuario, TokenAcceso } from "../models/seguridad.js";
import autorizacionService from "./autorizacionService.js";
import emailService from "./emailService.js";
import mesaService from "./mesaService.js";
import categoriaService from "./categoriaService.js";

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_super_segura_2024";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "tu_clave_refresh_super_segura_2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const SALT_ROUNDS = 12;
const MAX_INTENTOS = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 5);
const BLOQUEO_MINUTOS = Number(process.env.AUTH_LOCK_MINUTES || 15);

const hash = (valor) => crypto.createHash("sha256").update(valor).digest("hex");
const tokenAleatorio = () => crypto.randomBytes(32).toString("base64url");
const normalizarUsuario = (valor) => String(valor || "").trim().toLowerCase();
const normalizarEmail = (valor) => String(valor || "").trim().toLowerCase();
const fechaExpiracion = (horas) => new Date(Date.now() + horas * 60 * 60 * 1000);

function validarContrasena(contrasena, usuario = "") {
  if (typeof contrasena !== "string" || contrasena.length < 12 || contrasena.length > 100) throw new Error("La contraseña debe tener entre 12 y 100 caracteres");
  if (!/[a-z]/.test(contrasena) || !/[A-Z]/.test(contrasena) || !/\d/.test(contrasena) || !/[^A-Za-z0-9]/.test(contrasena)) throw new Error("La contraseña debe incluir mayúscula, minúscula, número y símbolo");
  if (usuario && contrasena.toLowerCase().includes(usuario.toLowerCase())) throw new Error("La contraseña no puede contener el usuario");
}

function base32Decode(valor) {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const caracter of valor.replace(/=+$/, "").toUpperCase()) {
    const indice = alfabeto.indexOf(caracter);
    if (indice < 0) throw new Error("Código MFA inválido");
    bits += indice.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totpValido(secreto, codigo) {
  if (!/^\d{6}$/.test(String(codigo))) return false;
  const contador = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some((desfase) => {
    const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(contador + desfase));
    const digest = crypto.createHmac("sha1", base32Decode(secreto)).update(buffer).digest();
    const offset = digest[digest.length - 1] & 15;
    const esperado = ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
    return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(String(codigo)));
  });
}

class UsuarioService {
  async auditar(evento, usuario, contexto = {}, detalle = null) {
    return HistorialAcceso.create({ usuarioId: usuario?.id || null, restauranteId: usuario?.restauranteId || null, evento, ip: contexto.ip || null, dispositivo: contexto.dispositivo || null, detalle });
  }

  async crearSesion(usuario, contexto = {}) {
    const contextoRol = await autorizacionService.obtenerContexto(usuario);
    const refreshToken = tokenAleatorio();
    const sesion = await SesionUsuario.create({ usuarioId: usuario.id, tokenHash: hash(refreshToken), dispositivo: contexto.dispositivo || null, ip: contexto.ip || null, expiraEn: fechaExpiracion(24 * 7) });
    const token = jwt.sign({ id: usuario.id, usuario: usuario.usuario, restauranteId: usuario.restauranteId, roles: contextoRol.roles, permisos: contextoRol.permisos, sid: sesion.id, tipo: "access" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { token, refreshToken, usuario: this.serializarUsuario(usuario, contextoRol), id: usuario.id, roles: contextoRol.roles, permisos: contextoRol.permisos, restauranteId: usuario.restauranteId };
  }

  serializarUsuario(usuario, contextoRol = null) {
    return { id: usuario.id, usuario: usuario.usuario, email: usuario.email, nombre: usuario.nombre, activo: usuario.activo, restauranteId: usuario.restauranteId, roles: contextoRol?.roles || [], permisos: contextoRol?.permisos || [], emailVerificado: Boolean(usuario.emailVerificadoEn), mfaHabilitado: usuario.mfaHabilitado };
  }

  async login(identificador, contrasena, codigoMfa, contexto) {
    const buscado = normalizarUsuario(identificador);
    const usuario = buscado.includes("@") ? await usuarioRepository.obtenerPorEmail(buscado) : await usuarioRepository.obtenerPorUsuario(buscado);
    if (!usuario) { await new Promise((resolve) => setTimeout(resolve, 500)); throw new Error("Usuario o contraseña inválidos"); }
    if (!usuario.activo) throw new Error("La cuenta está desactivada");
    if (usuario.email && !usuario.emailVerificadoEn) throw new Error("Verificá tu email antes de iniciar sesión");
    if (usuario.bloqueadoHasta && new Date(usuario.bloqueadoHasta) > new Date()) throw new Error("La cuenta está bloqueada temporalmente");
    const valida = await bcryptjs.compare(contrasena || "", usuario.contrasena);
    if (!valida) {
      const intentos = usuario.intentosFallidos + 1;
      await usuario.update({ intentosFallidos: intentos, bloqueadoHasta: intentos >= MAX_INTENTOS ? new Date(Date.now() + BLOQUEO_MINUTOS * 60000) : null });
      await this.auditar("login_fallido", usuario, contexto, "Credenciales inválidas");
      throw new Error("Usuario o contraseña inválidos");
    }
    if (usuario.mfaHabilitado && !totpValido(usuario.mfaSecreto, codigoMfa)) { await this.auditar("mfa_fallido", usuario, contexto); throw new Error("Código de autenticación inválido"); }
    await usuario.update({ intentosFallidos: 0, bloqueadoHasta: null });
    await this.auditar("login_exitoso", usuario, contexto);
    return this.crearSesion(usuario, contexto);
  }

  async refreshToken(refreshToken, contexto = {}) {
    const sesion = await SesionUsuario.findOne({ where: { tokenHash: hash(refreshToken), revocadaEn: null } });
    if (!sesion || new Date(sesion.expiraEn) <= new Date()) throw new Error("Sesión inválida o expirada");
    const usuario = await usuarioRepository.obtenerPorId(sesion.usuarioId);
    if (!usuario?.activo) throw new Error("Usuario no encontrado o desactivado");
    await sesion.update({ ultimoAccesoEn: new Date(), dispositivo: contexto.dispositivo || sesion.dispositivo, ip: contexto.ip || sesion.ip });
    return this.crearTokenAcceso(usuario, sesion.id);
  }

  async crearTokenAcceso(usuario, sid) {
    const contextoRol = await autorizacionService.obtenerContexto(usuario);
    return { token: jwt.sign({ id: usuario.id, usuario: usuario.usuario, restauranteId: usuario.restauranteId, roles: contextoRol.roles, permisos: contextoRol.permisos, sid, tipo: "access" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }), usuario: this.serializarUsuario(usuario, contextoRol), id: usuario.id, roles: contextoRol.roles, permisos: contextoRol.permisos };
  }

  async cerrarSesion(sid, usuario, contexto) { if (sid) await SesionUsuario.update({ revocadaEn: new Date() }, { where: { id: sid, usuarioId: usuario.id } }); await this.auditar("logout", usuario, contexto); }
  async sesiones(usuarioId) { return SesionUsuario.findAll({ where: { usuarioId, revocadaEn: null }, attributes: { exclude: ["tokenHash"] }, order: [["ultimoAccesoEn", "DESC"]] }); }
  async revocarSesion(usuario, sesionId, contexto) { const cantidad = await SesionUsuario.update({ revocadaEn: new Date() }, { where: { id: sesionId, usuarioId: usuario.id, revocadaEn: null } }); if (!cantidad[0]) throw new Error("Sesión no encontrada"); await this.auditar("sesion_revocada", usuario, contexto, sesionId); }

  async registrarRestaurante(datos, contexto) {
    const usuario = normalizarUsuario(datos.usuario); const email = normalizarEmail(datos.email); const slug = String(datos.slug || datos.restaurante || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!/^[a-z0-9._-]{3,50}$/.test(usuario) || !/^\S+@\S+\.\S+$/.test(email) || !slug) throw new Error("Completá un restaurante, usuario y email válidos");
    validarContrasena(datos.contrasena, usuario);
    if (await usuarioRepository.obtenerPorUsuario(usuario) || await usuarioRepository.obtenerPorEmail(email)) throw new Error("El usuario o email ya están registrados");
    const restaurante = await Restaurante.create({ nombre: String(datos.restaurante).trim(), slug, activo: true });
    const creado = await usuarioRepository.crear({ usuario, email, nombre: String(datos.nombre || "").trim() || null, contrasena: await bcryptjs.hash(datos.contrasena, SALT_ROUNDS), roles: "owner", restauranteId: restaurante.id, contrasenaCambiadaEn: new Date() });
    await autorizacionService.asignarRol(creado.id, restaurante.id, "owner");
    await mesaService.inicializar(restaurante.id, 12);
    await categoriaService.asegurarCategoriasBase(restaurante.id);
    const token = await this.enviarToken("verificacion_email", creado, restaurante.id);
    await this.auditar("registro_restaurante", creado, contexto);
    return { restaurante: { id: restaurante.id, nombre: restaurante.nombre, slug: restaurante.slug }, mensaje: "Registro creado. Verificá tu email para activar todas las funciones.", tokenDesarrollo: process.env.NODE_ENV === "production" ? undefined : token };
  }

  async enviarToken(tipo, usuario, restauranteId, datos = null) {
    const token = tokenAleatorio();
    const ruta = tipo === "verificacion_email" ? "/verificar-email" : tipo === "recuperacion_contrasena" ? "/restablecer-contrasena" : "/aceptar-invitacion";
    const enlace = emailService.enlace(ruta, token);
    await emailService.enviar({ para: tipo === "invitacion" ? datos.email : usuario.email, asunto: "Acceso a Frontbar", texto: `Usá este enlace para continuar: ${enlace}` });
    await TokenAcceso.create({ usuarioId: usuario?.id || null, restauranteId, tipo, tokenHash: hash(token), datos: datos ? JSON.stringify(datos) : null, expiraEn: fechaExpiracion(tipo === "invitacion" ? 72 : 2) });
    return token;
  }

  async solicitarRecuperacion(email, contexto) { const usuario = await usuarioRepository.obtenerPorEmail(normalizarEmail(email)); if (usuario?.activo) { await this.enviarToken("recuperacion_contrasena", usuario, usuario.restauranteId); await this.auditar("recuperacion_solicitada", usuario, contexto); } return { mensaje: "Si existe una cuenta asociada, recibirás instrucciones por email." }; }
  async usarToken(token, tipo) { const registro = await TokenAcceso.findOne({ where: { tokenHash: hash(token), tipo, usadoEn: null } }); if (!registro || new Date(registro.expiraEn) <= new Date()) throw new Error("El enlace es inválido o expiró"); return registro; }
  async verificarEmail(token) { const registro = await this.usarToken(token, "verificacion_email"); const usuario = await usuarioRepository.obtenerPorId(registro.usuarioId); await usuario.update({ emailVerificadoEn: new Date() }); await registro.update({ usadoEn: new Date() }); return { mensaje: "Email verificado correctamente" }; }
  async restablecerContrasena(token, contrasena, contexto) { const registro = await this.usarToken(token, "recuperacion_contrasena"); const usuario = await usuarioRepository.obtenerPorId(registro.usuarioId); validarContrasena(contrasena, usuario.usuario); await usuario.update({ contrasena: await bcryptjs.hash(contrasena, SALT_ROUNDS), contrasenaCambiadaEn: new Date(), intentosFallidos: 0, bloqueadoHasta: null }); await SesionUsuario.update({ revocadaEn: new Date() }, { where: { usuarioId: usuario.id, revocadaEn: null } }); await registro.update({ usadoEn: new Date() }); await this.auditar("contrasena_restablecida", usuario, contexto); return { mensaje: "Contraseña actualizada. Iniciá sesión nuevamente." }; }

  async invitar(usuarioActual, datos, contexto) { const email = normalizarEmail(datos.email); const username = normalizarUsuario(datos.usuario || email.split("@")[0]); if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email inválido"); if (await usuarioRepository.obtenerPorUsuario(username) || await usuarioRepository.obtenerPorEmail(email)) throw new Error("El usuario o email ya existen"); await autorizacionService.asegurarCatalogo(usuarioActual.restauranteId); const token = await this.enviarToken("invitacion", null, usuarioActual.restauranteId, { email, usuario: username, nombre: datos.nombre || null, rol: datos.rol || "mozo" }); await this.auditar("invitacion_enviada", usuarioActual, contexto, email); return { mensaje: "Invitación enviada", tokenDesarrollo: process.env.NODE_ENV === "production" ? undefined : token }; }
  async crearUsuario(usuarioActual, datos, contexto) {
    const usuario = normalizarUsuario(datos.usuario);
    const email = datos.email ? normalizarEmail(datos.email) : null;
    const rol = String(datos.rol || "mozo").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,50}$/.test(usuario)) throw new Error("El usuario debe tener entre 3 y 50 caracteres y usar letras, números, puntos, guiones o guiones bajos");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email inválido");
    validarContrasena(datos.contrasena, usuario);
    if (await usuarioRepository.obtenerPorUsuario(usuario) || (email && await usuarioRepository.obtenerPorEmail(email))) throw new Error("El usuario o email ya existen");
    await autorizacionService.asegurarCatalogo(usuarioActual.restauranteId);
    const creado = await usuarioRepository.crear({ usuario, email, nombre: String(datos.nombre || "").trim() || null, contrasena: await bcryptjs.hash(datos.contrasena, SALT_ROUNDS), roles: rol, restauranteId: usuarioActual.restauranteId, emailVerificadoEn: email ? new Date() : null, contrasenaCambiadaEn: new Date() });
    try {
      await autorizacionService.asignarRol(creado.id, usuarioActual.restauranteId, rol);
    } catch (error) {
      await creado.destroy();
      throw error;
    }
    await this.auditar("usuario_creado", usuarioActual, contexto, creado.usuario);
    return this.serializarUsuario(creado, await autorizacionService.obtenerContexto(creado));
  }
  async aceptarInvitacion(token, contrasena, contexto) { const registro = await this.usarToken(token, "invitacion"); const datos = JSON.parse(registro.datos); validarContrasena(contrasena, datos.usuario); const usuario = await usuarioRepository.crear({ usuario: datos.usuario, email: datos.email, nombre: datos.nombre, contrasena: await bcryptjs.hash(contrasena, SALT_ROUNDS), roles: datos.rol, restauranteId: registro.restauranteId, emailVerificadoEn: new Date(), contrasenaCambiadaEn: new Date() }); await autorizacionService.asignarRol(usuario.id, usuario.restauranteId, datos.rol); await registro.update({ usadoEn: new Date() }); await this.auditar("invitacion_aceptada", usuario, contexto); return { mensaje: "Cuenta activada. Ya podés iniciar sesión." }; }

  async configurarMfa(usuario, codigo) { if (!usuario.mfaSecreto) { const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; const secreto = Array.from(crypto.randomBytes(32), (byte) => alfabeto[byte % alfabeto.length]).join(""); await usuario.update({ mfaSecreto: secreto }); return { secreto, otpauth: `otpauth://totp/Frontbar:${encodeURIComponent(usuario.email || usuario.usuario)}?secret=${secreto}&issuer=Frontbar` }; } if (!totpValido(usuario.mfaSecreto, codigo)) throw new Error("Código de autenticación inválido"); await usuario.update({ mfaHabilitado: true }); return { mensaje: "Autenticación multifactor activada" }; }

  async crearUsuarioOwner() {
    const [restaurante] = await Restaurante.findOrCreate({ where: { slug: process.env.DEFAULT_RESTAURANT_SLUG || "la-esquina" }, defaults: { nombre: process.env.DEFAULT_RESTAURANT_NAME || "La Esquina", activo: true } });
    let usuario = await usuarioRepository.obtenerPorUsuario(process.env.ADMIN_USERNAME || "main");
    if (!usuario) usuario = await usuarioRepository.crear({ usuario: process.env.ADMIN_USERNAME || "main", contrasena: await bcryptjs.hash(process.env.ADMIN_PASSWORD || "main123", SALT_ROUNDS), roles: "owner", restauranteId: restaurante.id });
    else if (!usuario.restauranteId || usuario.restauranteId !== restaurante.id) await usuario.update({ restauranteId: restaurante.id });
    await autorizacionService.asignarRol(usuario.id, restaurante.id, "owner");
    return restaurante;
  }
}

export default new UsuarioService();
export { JWT_SECRET, JWT_REFRESH_SECRET };
