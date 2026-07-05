import RepositorioBase from "./repositorioBase.js";
import TurnoCaja from "../models/turnoCaja.js";

class TurnoCajaRepository extends RepositorioBase {
  constructor() {
    super(TurnoCaja);
  }

  async obtenerAbierto(restauranteId) {
    return this.modelo.findOne({
      where: { restauranteId, estado: "abierto" },
      order: [["fechaApertura", "DESC"]]
    });
  }
}

export default new TurnoCajaRepository();
