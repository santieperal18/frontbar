import clienteRepository from "../repositories/clienteRepository.js";

class ClienteService {
  async obtenerTodos(restauranteId) {
    return clienteRepository.obtenerTodos(restauranteId);
  }

  async obtenerPorId(id, restauranteId) {
    return clienteRepository.obtenerPorId(id, restauranteId);
  }

  async crear(datos, restauranteId) {
    return clienteRepository.crear(this.#convertirEntrada(datos), restauranteId);
  }

  async actualizar(id, datos, restauranteId) {
    return clienteRepository.actualizar(id, this.#convertirEntrada(datos), restauranteId);
  }

  async eliminar(id, restauranteId) {
    return clienteRepository.actualizar(id, { activo: false }, restauranteId);
  }

  async buscarPorNombre(nombre, restauranteId) {
    return clienteRepository.buscarPorNombre(nombre, restauranteId);
  }

  #convertirEntrada(datos) {
    const { confirmarEmail, confirmarTelefono, ...resto } = datos;
    return resto;
  }
}

export default new ClienteService();
