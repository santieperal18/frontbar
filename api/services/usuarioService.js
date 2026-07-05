import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import usuarioRepository from "../repositories/usuarioRepository.js";
import Restaurante from "../models/restaurante.js";

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_super_segura_2024";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "tu_clave_refresh_super_segura_2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const SALT_ROUNDS = 12;

class UsuarioService {
  async login(usuario, contrasena) {
    if (!usuario || !contrasena) {
      throw new Error("Usuario y contraseña son requeridos");
    }

    const usuarioEncontrado = await usuarioRepository.obtenerPorUsuario(String(usuario).trim());
    if (!usuarioEncontrado) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error("Usuario o contraseña inválidos");
    }

    const valida = await bcryptjs.compare(contrasena, usuarioEncontrado.contrasena);
    if (!valida) {
      throw new Error("Usuario o contraseña inválidos");
    }

    const token = jwt.sign({
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      roles: usuarioEncontrado.roles,
      restauranteId: usuarioEncontrado.restauranteId,
      tipo: "access"
    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const refreshToken = jwt.sign({
      id: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      restauranteId: usuarioEncontrado.restauranteId,
      tipo: "refresh"
    }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    return {
      token,
      refreshToken,
      usuario: usuarioEncontrado.usuario,
      id: usuarioEncontrado.id,
      roles: usuarioEncontrado.roles,
      restauranteId: usuarioEncontrado.restauranteId
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const usuario = await usuarioRepository.obtenerPorId(decoded.id);
      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }

      const token = jwt.sign({
        id: usuario.id,
        usuario: usuario.usuario,
        roles: usuario.roles,
        restauranteId: usuario.restauranteId,
        tipo: "access"
      }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return {
        token,
        usuario: usuario.usuario,
        id: usuario.id,
        restauranteId: usuario.restauranteId
      };
    } catch {
      throw new Error("Refresh token inválido o expirado");
    }
  }

  async crearUsuarioOwner() {
    const [restaurante] = await Restaurante.findOrCreate({
      where: { slug: process.env.DEFAULT_RESTAURANT_SLUG || "la-esquina" },
      defaults: {
        nombre: process.env.DEFAULT_RESTAURANT_NAME || "La Esquina",
        activo: true
      }
    });

    const usuarioExistente = await usuarioRepository.obtenerPorUsuario(process.env.ADMIN_USERNAME || "main");
    if (usuarioExistente) {
      if (!usuarioExistente.restauranteId || usuarioExistente.restauranteId !== restaurante.id) {
        await usuarioExistente.update({ restauranteId: restaurante.id });
      }
      return restaurante;
    }

    const contrasena = await bcryptjs.hash(process.env.ADMIN_PASSWORD || "main123", SALT_ROUNDS);
    await usuarioRepository.crear({
      usuario: process.env.ADMIN_USERNAME || "main",
      contrasena,
      roles: "owner",
      restauranteId: restaurante.id
    });

    return restaurante;
  }
}

export default new UsuarioService();
export { JWT_SECRET, JWT_REFRESH_SECRET };
