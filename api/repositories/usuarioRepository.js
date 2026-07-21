import RepositorioBase from "./repositorioBase.js";
import Usuario from "../models/usuario.js";

class UsuarioRepository extends RepositorioBase {
  constructor() {
    super(Usuario);
  }

  async obtenerPorUsuario(usuario) {
    return this.modelo.findOne({
      where: { usuario }
    });
  }

  async obtenerPorEmail(email) {
    return this.modelo.findOne({ where: { email: String(email).trim().toLowerCase() } });
  }
}

export default new UsuarioRepository();
