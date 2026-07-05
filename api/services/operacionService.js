import cajaService from "./cajaService.js";
import mesaService from "./mesaService.js";
import pedidoService from "./pedidoService.js";

class OperacionService {
  async obtenerSalon(restauranteId) {
    const [mesas, pedidosSalon, turnoCaja] = await Promise.all([
      mesaService.obtenerTodas(restauranteId),
      pedidoService.filtrar({ canal: "salon", estados: ["pendiente", "preparando", "listo", "entregado"] }, restauranteId),
      cajaService.obtenerTurnoActual(restauranteId)
    ]);

    const porMesa = new Map(pedidosSalon.filter((pedido) => pedido.idMesa).map((pedido) => [pedido.idMesa, pedido]));
    return {
      mesas: mesas.map((mesa) => ({
        ...(mesa.toJSON ? mesa.toJSON() : mesa),
        pedidoActivo: porMesa.get(mesa.id) || null
      })),
      turnoCaja
    };
  }
}

export default new OperacionService();
