import RepositorioBase from "./repositorioBase.js";
import Repartidor from "../models/repartidor.js";

class RepartidorRepository extends RepositorioBase {
  constructor() {
    super(Repartidor);
  }

  async obtenerTodos(restauranteId) {
    return this.modelo.findAll({
      where: { activo: true, restauranteId },
      order: [["apellido", "ASC"], ["nombre", "ASC"]]
    });
  }

  async obtenerDisponibles(restauranteId) {
    return this.modelo.findAll({
      where: { activo: true, restauranteId },
      order: [["apellido", "ASC"]]
    });
  }

  async buscarPorNombre(nombre, restauranteId) {
    const { Op } = await import("sequelize");
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

export default new RepartidorRepository();
