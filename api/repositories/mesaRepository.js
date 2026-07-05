import RepositorioBase from "./repositorioBase.js";
import Mesa from "../models/mesa.js";

class MesaRepository extends RepositorioBase {
  constructor() {
    super(Mesa);
  }

  async obtenerTodas(restauranteId) {
    return this.modelo.findAll({
      where: { restauranteId },
      order: [["numero", "ASC"]]
    });
  }
}

export default new MesaRepository();
