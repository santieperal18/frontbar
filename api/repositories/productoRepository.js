import RepositorioBase from "./repositorioBase.js";
import Producto from "../models/producto.js";
import Categoria from "../models/categoria.js";

class ProductoRepository extends RepositorioBase {
  constructor() {
    super(Producto);
  }

  async obtenerTodos(restauranteId, incluirOcultos = false) {
    return this.modelo.findAll({
      where: { restauranteId, ...(incluirOcultos ? {} : { disponible: true }) },
      include: [{
        model: Categoria,
        as: "categoria",
        where: { restauranteId }
      }],
      order: [["nombre", "ASC"]]
    });
  }

  async obtenerPorCategoria(idCategoria, restauranteId) {
    return this.modelo.findAll({
      where: { idCategoria, restauranteId, disponible: true },
      include: [{
        model: Categoria,
        as: "categoria",
        where: { restauranteId }
      }]
    });
  }

  async obtenerPorTipo(tipo, restauranteId) {
    return this.modelo.findAll({
      include: [{
        model: Categoria,
        as: "categoria",
        where: { tipo, restauranteId }
      }],
      where: { disponible: true, restauranteId }
    });
  }
}

export default new ProductoRepository();
