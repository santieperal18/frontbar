import mesaRepository from "../repositories/mesaRepository.js";

class MesaService {
  async inicializar(restauranteId, cantidad = 12) {
    const existentes = await mesaRepository.obtenerTodas(restauranteId);
    if (existentes.length > 0) {
      return existentes;
    }

    const mesas = [];
    for (let numero = 1; numero <= cantidad; numero += 1) {
      mesas.push(await mesaRepository.crear({ numero, estado: "libre" }, restauranteId));
    }
    return mesas;
  }

  async obtenerTodas(restauranteId) {
    return mesaRepository.obtenerTodas(restauranteId);
  }

  async actualizarEstado(id, restauranteId, estado) {
    return mesaRepository.actualizar(id, { estado }, restauranteId);
  }
}

export default new MesaService();
