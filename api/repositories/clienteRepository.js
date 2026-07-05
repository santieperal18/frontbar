import { Op } from "sequelize";
import RepositorioBase from "./repositorioBase.js";
import Cliente from "../models/cliente.js";

class ClienteRepository extends RepositorioBase {
  constructor() {
    super(Cliente);
  }

  async obtenerTodos(restauranteId) {
    return this.modelo.findAll({
      where: { activo: true, restauranteId },
      order: [["apellido", "ASC"], ["nombre", "ASC"]]
    });
  }

  async buscarPorNombre(nombre, restauranteId) {
    return this.modelo.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${nombre}%` } },
          { apellido: { [Op.like]: `%${nombre}%` } }
        ],
        activo: true,
        restauranteId
      }
    });
  }

  async buscarDuplicado({ telefono, email }, restauranteId) {
    const condiciones = [];
    if (telefono) condiciones.push({ telefono });
    if (email) condiciones.push({ email });
    if (!condiciones.length) return null;

    return this.modelo.findOne({
      where: {
        [Op.or]: condiciones,
        activo: true,
        restauranteId
      }
    });
  }
}

export default new ClienteRepository();
