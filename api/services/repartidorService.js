import repartidorRepository from "../repositories/repartidorRepository.js";

class RepartidorService {
  async obtenerTodos(restauranteId) {
    return repartidorRepository.obtenerTodos(restauranteId);
  }

  async obtenerPorId(id, restauranteId) {
    return repartidorRepository.obtenerPorId(id, restauranteId);
  }

  async obtenerDisponibles(restauranteId) {
    return repartidorRepository.obtenerDisponibles(restauranteId);
  }

  async crear(datos, restauranteId) {
    return repartidorRepository.crear({ ...datos }, restauranteId);
  }

  async actualizar(id, datos, restauranteId) {
    return repartidorRepository.actualizar(id, { ...datos }, restauranteId);
  }

  async eliminar(id, restauranteId) {
    return repartidorRepository.actualizar(id, { activo: false }, restauranteId);
  }

  async buscarPorNombre(nombre, restauranteId) {
    return repartidorRepository.buscarPorNombre(nombre, restauranteId);
  }
}

export default new RepartidorService();
