import productoRepository from "../repositories/productoRepository.js";
import clienteRepository from "../repositories/clienteRepository.js";
import repartidorRepository from "../repositories/repartidorRepository.js";
import pedidoRepository from "../repositories/pedidoRepository.js";
import mesaRepository from "../repositories/mesaRepository.js";

class PedidoService {
  async obtenerTodos({ pagina = 1, limite = 10 } = {}, restauranteId) {
    const pedidos = await pedidoRepository.obtenerTodos({ pagina, limite }, restauranteId);
    return pedidos.map(this.#convertirSalida);
  }

  async obtenerPorId(id, restauranteId) {
    const pedido = await pedidoRepository.obtenerPorId(id, restauranteId);
    return pedido ? this.#convertirSalida(pedido) : null;
  }

  async obtenerPorCliente(idCliente, restauranteId) {
    const pedidos = await pedidoRepository.obtenerPorCliente(idCliente, restauranteId);
    return pedidos.map(this.#convertirSalida);
  }

  async filtrar(filtros, restauranteId) {
    const pedidos = await pedidoRepository.filtrar(filtros, restauranteId);
    return pedidos.map(this.#convertirSalida);
  }

  async crear(datos, restauranteId) {
    if (!datos.productos?.length) {
      throw new Error("El pedido debe tener al menos un producto");
    }

    const datosPedido = {
      idCliente: datos.idCliente ? parseInt(datos.idCliente) : null,
      idRepartidor: datos.tipoEntrega === "delivery" && datos.idRepartidor ? parseInt(datos.idRepartidor) : null,
      idMesa: datos.idMesa ? parseInt(datos.idMesa) : null,
      tipoEntrega: this.#normalizarCanal(datos.tipoEntrega, datos.idMesa),
      direccionEntrega: datos.direccionEntrega || null,
      observaciones: datos.observaciones || null,
      estado: datos.estado || "pendiente",
      estadoPago: datos.estadoPago || "pendiente",
      total: 0
    };

    if (datosPedido.idCliente) {
      const cliente = await clienteRepository.obtenerPorId(datosPedido.idCliente, restauranteId);
      if (!cliente) {
        throw new Error(`Cliente con ID ${datosPedido.idCliente} no encontrado`);
      }
    }

    if (datosPedido.idRepartidor) {
      const repartidor = await repartidorRepository.obtenerPorId(datosPedido.idRepartidor, restauranteId);
      if (!repartidor || !repartidor.activo) {
        throw new Error(`Repartidor con ID ${datosPedido.idRepartidor} no encontrado o inactivo`);
      }
    }

    const productosValidos = [];
    for (const productoPedido of datos.productos) {
      const producto = await productoRepository.obtenerPorId(productoPedido.id, restauranteId);
      if (!producto || !producto.disponible) {
        throw new Error(`Producto con ID ${productoPedido.id} no encontrado o no disponible`);
      }

      const cantidadSolicitada = Number(productoPedido.cantidad || 1);
      if (producto.controlaStock && Number(producto.stockActual || 0) < cantidadSolicitada) {
        throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`);
      }

      const precioSeleccionado = datosPedido.tipoEntrega === "salon"
        ? parseFloat(producto.precioSalon || producto.precio)
        : parseFloat(producto.precioMostrador || producto.precio);

      productosValidos.push({
        id: producto.id,
        cantidad: cantidadSolicitada,
        precio: precioSeleccionado
      });
    }

    const creado = await pedidoRepository.crearConProductos(datosPedido, productosValidos, restauranteId);
    await this.#actualizarStock(productosValidos, restauranteId, "descontar");

    if (datosPedido.idMesa) {
      await mesaRepository.actualizar(datosPedido.idMesa, { estado: "ocupada" }, restauranteId);
    }

    return this.#convertirSalida(creado);
  }

  async actualizar(id, datos, restauranteId) {
    const actualizado = await pedidoRepository.actualizar(id, { ...datos }, restauranteId);
    return this.#convertirSalida(actualizado);
  }

  async actualizarEstado(id, estado, restauranteId) {
    const actualizado = await pedidoRepository.actualizar(id, { estado }, restauranteId);
    if (estado === "cancelado") {
      await this.#reponerStockDesdePedido(id, restauranteId);
    }
    return this.#convertirSalida(actualizado);
  }

  async marcarPidiendoCuenta(id, restauranteId) {
    const pedido = await pedidoRepository.obtenerPorId(id, restauranteId);
    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }
    if (pedido.idMesa) {
      await mesaRepository.actualizar(pedido.idMesa, { estado: "pidiendo_cuenta" }, restauranteId);
    }
    const actualizado = await pedidoRepository.actualizar(id, { estadoPago: "pidiendo_cuenta" }, restauranteId);
    return this.#convertirSalida(actualizado);
  }

  async obtenerComandasCocina(restauranteId) {
    const fecha = new Date().toISOString().split("T")[0];
    const pedidos = await pedidoRepository.filtrar({
      fechaDesde: fecha,
      fechaHasta: fecha,
      estados: ["pendiente", "preparando", "listo"]
    }, restauranteId);
    return pedidos.map(this.#convertirSalida);
  }

  async avanzarEstadoCocina(id, restauranteId) {
    const pedido = await pedidoRepository.obtenerPorId(id, restauranteId);
    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }
    const secuencia = ["pendiente", "preparando", "listo"];
    const indice = secuencia.indexOf(pedido.estado);
    const estado = indice === -1 || indice === secuencia.length - 1 ? "listo" : secuencia[indice + 1];
    const actualizado = await pedidoRepository.actualizar(id, { estado }, restauranteId);
    return this.#convertirSalida(actualizado);
  }

  async eliminar(id, restauranteId) {
    return pedidoRepository.eliminar(id, restauranteId);
  }

  #normalizarCanal(tipoEntrega, idMesa) {
    if (idMesa) return "salon";
    if (tipoEntrega === "delivery") return "delivery";
    if (tipoEntrega === "local") return "mostrador";
    return tipoEntrega || "mostrador";
  }

  async #actualizarStock(productosPedido, restauranteId, modo) {
    for (const item of productosPedido) {
      const producto = await productoRepository.obtenerPorId(item.id, restauranteId);
      if (!producto?.controlaStock) continue;
      const actual = Number(producto.stockActual || 0);
      const cantidad = Number(item.cantidad || 0);
      const stockActual = modo === "descontar" ? Math.max(0, actual - cantidad) : actual + cantidad;
      await productoRepository.actualizar(producto.id, { stockActual }, restauranteId);
    }
  }

  async #reponerStockDesdePedido(idPedido, restauranteId) {
    const pedido = await pedidoRepository.obtenerPorId(idPedido, restauranteId);
    if (!pedido?.productos?.length) return;
    const productos = pedido.productos.map((producto) => ({
      id: producto.id,
      cantidad: producto.PedidoProducto?.cantidad || producto.cantidad || 0
    }));
    await this.#actualizarStock(productos, restauranteId, "reponer");
  }

  #convertirSalida(pedido) {
    const obj = pedido.toJSON ? pedido.toJSON() : pedido;
    obj.total = parseFloat(obj.total || 0);
    if (obj.productos) {
      obj.productos = obj.productos.map((producto) => {
        const prod = producto.toJSON ? producto.toJSON() : producto;
        prod.precio = parseFloat(prod.precio || 0);
        return prod;
      });
    }
    return obj;
  }
}

export default new PedidoService();
