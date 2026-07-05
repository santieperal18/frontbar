import { QueryTypes } from "sequelize";
import sequelize from "../db.js";
import turnoCajaRepository from "../repositories/turnoCajaRepository.js";
import pagoPedidoRepository from "../repositories/pagoPedidoRepository.js";
import pedidoRepository from "../repositories/pedidoRepository.js";
import mesaRepository from "../repositories/mesaRepository.js";

class CajaService {
  async obtenerTurnoActual(restauranteId) {
    const turno = await turnoCajaRepository.obtenerAbierto(restauranteId);
    if (!turno) return null;
    return {
      ...turno.toJSON(),
      ...(await this.#resumen(turno.id, restauranteId))
    };
  }

  async abrirTurno(restauranteId, montoApertura = 0) {
    const actual = await turnoCajaRepository.obtenerAbierto(restauranteId);
    if (actual) {
      throw new Error("Ya existe un turno abierto");
    }
    return turnoCajaRepository.crear({
      montoApertura: Number(montoApertura || 0),
      estado: "abierto"
    }, restauranteId);
  }

  async cerrarTurno(restauranteId) {
    const turno = await turnoCajaRepository.obtenerAbierto(restauranteId);
    if (!turno) {
      throw new Error("No hay un turno abierto");
    }
    const resumen = await this.#resumen(turno.id, restauranteId);
    const cerrado = await turnoCajaRepository.actualizar(turno.id, {
      estado: "cerrado",
      fechaCierre: new Date()
    }, restauranteId);
    return { ...cerrado.toJSON(), ...resumen };
  }

  async cobrarPedido(idPedido, restauranteId, pagos) {
    const turno = await turnoCajaRepository.obtenerAbierto(restauranteId);
    if (!turno) throw new Error("No hay un turno de caja abierto");
    const pedido = await pedidoRepository.obtenerPorId(idPedido, restauranteId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (!Array.isArray(pagos) || pagos.length === 0) {
      throw new Error("Debe informar los pagos");
    }

    const totalPagado = pagos.reduce((acc, pago) => acc + Number(pago.monto || 0), 0);
    const totalPedido = Number(pedido.total || 0);
    if (Math.abs(totalPagado - totalPedido) > 0.01) {
      throw new Error("La suma de pagos no coincide con el total");
    }

    const transaction = await sequelize.transaction();
    try {
      for (const pago of pagos) {
        await pagoPedidoRepository.crear({
          idPedido,
          idTurnoCaja: turno.id,
          metodoPago: pago.metodoPago,
          monto: Number(pago.monto || 0)
        }, restauranteId, { transaction });
      }

      await pedidoRepository.actualizar(idPedido, { estadoPago: "pagado", estado: "cobrado" }, restauranteId, { transaction });
      if (pedido.idMesa) {
        await mesaRepository.actualizar(pedido.idMesa, { estado: "libre" }, restauranteId, { transaction });
      }
      await transaction.commit();
      return pedidoRepository.obtenerPorId(idPedido, restauranteId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async #resumen(idTurnoCaja, restauranteId) {
    const filas = await sequelize.query(
      `SELECT metodo_pago as "metodoPago", SUM(monto) as total
       FROM pago_pedido
       WHERE restaurante_id = :restauranteId AND id_turno_caja = :idTurnoCaja
       GROUP BY metodo_pago`,
      {
        replacements: { restauranteId, idTurnoCaja },
        type: QueryTypes.SELECT
      }
    );

    const porMetodo = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    let totalFacturado = 0;
    for (const fila of filas) {
      const total = Number(fila.total || 0);
      porMetodo[fila.metodoPago] = total;
      totalFacturado += total;
    }
    return { porMetodo, totalFacturado };
  }
}

export default new CajaService();
