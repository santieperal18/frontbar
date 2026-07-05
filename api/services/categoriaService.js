import categoriaRepository from "../repositories/categoriaRepository.js";

const CATEGORIAS_BASE = [
  { nombre: "Lomos y Hamburguesas", tipo: "comida", descripcion: "Sandwiches, hamburguesas y lomos" },
  { nombre: "Pizzas", tipo: "comida", descripcion: "Pizzas y porciones" },
  { nombre: "Bebidas", tipo: "bebida", descripcion: "Gaseosas, cervezas y tragos" },
  { nombre: "Postres", tipo: "comida", descripcion: "Postres y opciones dulces" }
];

class CategoriaService {
  async obtenerTodos(restauranteId) {
    return categoriaRepository.obtenerTodos(restauranteId);
  }

  async obtenerPorId(id, restauranteId) {
    return categoriaRepository.obtenerPorId(id, restauranteId);
  }

  async obtenerPorTipo(tipo, restauranteId) {
    return categoriaRepository.obtenerPorTipo(tipo, restauranteId);
  }

  async crear(datos, restauranteId) {
    await this.#validarCategoria(datos, null, restauranteId);
    return categoriaRepository.crear({ ...datos }, restauranteId);
  }

  async actualizar(id, datos, restauranteId) {
    await this.#validarCategoria(datos, id, restauranteId);
    return categoriaRepository.actualizar(id, { ...datos }, restauranteId);
  }

  async eliminar(id, restauranteId) {
    const categoria = await categoriaRepository.obtenerConProductos(id, restauranteId);
    if (categoria?.productos?.length) {
      throw new Error("No se puede eliminar la categoría porque tiene productos asociados");
    }
    return categoriaRepository.eliminar(id, restauranteId);
  }

  async asegurarCategoriasBase(restauranteId) {
    const actuales = await categoriaRepository.obtenerTodos(restauranteId);
    if (actuales.length > 0) {
      return actuales;
    }

    for (const categoria of CATEGORIAS_BASE) {
      await categoriaRepository.crear(categoria, restauranteId);
    }

    return categoriaRepository.obtenerTodos(restauranteId);
  }

  async #validarCategoria(datos, idActual, restauranteId) {
    if (datos.nombre) {
      const { Op } = await import("sequelize");
      const existente = await categoriaRepository.buscar({
        nombre: datos.nombre,
        ...(idActual ? { id: { [Op.ne]: idActual } } : {})
      }, {}, restauranteId);
      if (existente.length > 0) {
        throw new Error(`Ya existe una categoría con el nombre: ${datos.nombre}`);
      }
    }
  }
}

export default new CategoriaService();
