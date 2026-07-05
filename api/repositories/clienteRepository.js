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
}

export default new ClienteRepository();
