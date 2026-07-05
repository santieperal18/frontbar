import { Op } from "sequelize";
import RepositorioBase from "./repositorioBase.js";
import Pedido from "../models/pedido.js";
import Cliente from "../models/cliente.js";
import Repartidor from "../models/repartidor.js";
import PedidoProducto from "../models/pedidoProducto.js";
import Producto from "../models/producto.js";
import Mesa from "../models/mesa.js";

class PedidoRepository extends RepositorioBase {
  constructor() {
    super(Pedido);
  }

  include(restauranteId) {
    return [
      { model: Cliente, as: "cliente", required: false, where: { restauranteId } },
      { model: Repartidor, as: "repartidor", required: false, where: { restauranteId } },
      { model: Mesa, as: "mesa", required: false, where: { restauranteId } },
      {
        model: Producto,
        as: "productos",
        required: false,
        where: { restauranteId },
        through: { attributes: ["cantidad", "precioUnitario", "subtotal"] }
      }
    ];
  }

  async obtenerTodos({ pagina = 1, limite = 10 } = {}, restauranteId) {
    const offset = (pagina - 1) * limite;
    return this.modelo.findAll({
      where: { restauranteId },
      include: this.include(restauranteId),
      order: [["fecha", "DESC"]],
      limit: parseInt(limite),
      offset: parseInt(offset)
    });
  }

  async obtenerPorId(id, restauranteId) {
    return this.modelo.findOne({
      where: { id, restauranteId },
      include: this.include(restauranteId)
    });
  }

  async obtenerPorFecha(fechaInicio, fechaFin, restauranteId) {
    return this.modelo.findAll({
      where: {
        restauranteId,
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: { [Op.ne]: "cancelado" }
      },
      include: this.include(restauranteId),
      order: [["fecha", "ASC"]]
    });
  }

  async obtenerPorCliente(idCliente, restauranteId) {
    return this.modelo.findAll({
      where: { idCliente, restauranteId },
      include: this.include(restauranteId),
      order: [["fecha", "DESC"]]
    });
  }

  async filtrar(filtros, restauranteId) {
    const condiciones = { restauranteId };
    if (filtros.cliente) condiciones.idCliente = filtros.cliente;
    if (filtros.estado) condiciones.estado = filtros.estado;
    if (filtros.tipoEntrega) condiciones.tipoEntrega = filtros.tipoEntrega;
    if (filtros.canal) condiciones.tipoEntrega = filtros.canal;
    if (Array.isArray(filtros.estados) && filtros.estados.length > 0) {
      condiciones.estado = { [Op.in]: filtros.estados };
    }

    if (filtros.fechaDesde && filtros.fechaHasta) {
      const desde = new Date(filtros.fechaDesde);
      const hasta = new Date(filtros.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      condiciones.fecha = {
        [Op.between]: [desde, hasta]
      };
    }

    return this.modelo.findAll({
      where: condiciones,
      include: this.include(restauranteId),
      order: [["fecha", "DESC"]]
    });
  }

  async crearConProductos(datosPedido, productos, restauranteId) {
    const transaction = await this.modelo.sequelize.transaction();
    try {
      const pedido = await this.modelo.create({ ...datosPedido, restauranteId }, { transaction });
      let total = 0;
      const productosPedido = [];

      for (const producto of productos) {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;
        productosPedido.push({
          idPedido: pedido.id,
          idProducto: producto.id,
          cantidad: producto.cantidad,
          precioUnitario: producto.precio,
          subtotal,
          restauranteId
        });
      }

      await PedidoProducto.bulkCreate(productosPedido, { transaction });
      await pedido.update({ total }, { transaction });
      await transaction.commit();
      return this.obtenerPorId(pedido.id, restauranteId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new PedidoRepository();
