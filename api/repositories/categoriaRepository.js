import RepositorioBase from "./repositorioBase.js";
import Categoria from "../models/categoria.js";
import Producto from "../models/producto.js";

class CategoriaRepository extends RepositorioBase {
  constructor() {
    super(Categoria);
  }

  async obtenerTodos(restauranteId) {
    return this.modelo.findAll({
      where: { restauranteId },
      order: [["tipo", "ASC"], ["nombre", "ASC"]]
    });
  }

  async obtenerPorTipo(tipo, restauranteId) {
    return this.modelo.findAll({
      where: { tipo, restauranteId },
      order: [["nombre", "ASC"]]
    });
  }

  async obtenerConProductos(id, restauranteId) {
    return this.modelo.findOne({
      where: { id, restauranteId },
      include: [{
        model: Producto,
        as: "productos",
        required: false,
        where: { restauranteId }
      }]
    });
  }
}

export default new CategoriaRepository();
