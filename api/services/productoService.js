import categoriaRepository from "../repositories/categoriaRepository.js";
import productoRepository from "../repositories/productoRepository.js";

class ProductoService {
  async obtenerTodos(restauranteId, incluirOcultos = false) {
    const productos = await productoRepository.obtenerTodos(restauranteId, incluirOcultos);
    return productos.map(this.#convertirSalida);
  }

  async obtenerPorId(id, restauranteId) {
    const producto = await productoRepository.obtenerPorId(id, restauranteId);
    return producto ? this.#convertirSalida(producto) : null;
  }

  async obtenerPorCategoria(idCategoria, restauranteId) {
    const productos = await productoRepository.obtenerPorCategoria(idCategoria, restauranteId);
    return productos.map(this.#convertirSalida);
  }

  async obtenerPorTipo(tipo, restauranteId) {
    const productos = await productoRepository.obtenerPorTipo(tipo, restauranteId);
    return productos.map(this.#convertirSalida);
  }

  async crear(datos, restauranteId) {
    await this.#validarProducto(datos, null, restauranteId);
    await this.#validarCategoria(datos.idCategoria, restauranteId);
    const creado = await productoRepository.crear(this.#convertirEntrada(datos), restauranteId);
    return this.#convertirSalida(creado);
  }

  async actualizar(id, datos, restauranteId) {
    await this.#validarProducto(datos, id, restauranteId);
    if (datos.idCategoria) {
      await this.#validarCategoria(datos.idCategoria, restauranteId);
    }
    const actualizado = await productoRepository.actualizar(id, this.#convertirEntrada(datos), restauranteId);
    return this.#convertirSalida(actualizado);
  }

  async eliminar(id, restauranteId) {
    const actualizado = await productoRepository.actualizar(id, { disponible: false }, restauranteId);
    return this.#convertirSalida(actualizado);
  }

  async #validarProducto(datos, idActual, restauranteId) {
    if (datos.nombre) {
      const { Op } = await import("sequelize");
      const existente = await productoRepository.buscar({
        nombre: datos.nombre,
        ...(idActual ? { id: { [Op.ne]: idActual } } : {})
      }, {}, restauranteId);
      if (existente.length > 0) {
        throw new Error(`Ya existe un producto con el nombre: ${datos.nombre}`);
      }
    }
  }

  async #validarCategoria(idCategoria, restauranteId) {
    const categoria = await categoriaRepository.obtenerPorId(idCategoria, restauranteId);
    if (!categoria) {
      throw new Error(`La categoría con ID ${idCategoria} no existe`);
    }
  }

  #convertirSalida(producto) {
    const obj = producto.toJSON ? producto.toJSON() : producto;
    obj.precio = parseFloat(obj.precio || 0);
    obj.precioSalon = parseFloat(obj.precioSalon || obj.precio || 0);
    obj.precioMostrador = parseFloat(obj.precioMostrador || obj.precio || 0);
    obj.stockActual = Number(obj.stockActual || 0);
    return obj;
  }

  #convertirEntrada(datos) {
    const precioMostrador = parseFloat(datos.precioMostrador ?? datos.precio ?? 0);
    const precioSalon = parseFloat(datos.precioSalon ?? datos.precio ?? precioMostrador);
    return {
      ...datos,
      precio: precioMostrador,
      precioMostrador,
      precioSalon,
      controlaStock: Boolean(datos.controlaStock),
      stockActual: Number(datos.stockActual || 0)
    };
  }
}

export default new ProductoService();
