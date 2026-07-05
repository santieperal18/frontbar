import PDFDocument from "pdfkit";
import sequelize from "../db.js";
import pedidoRepository from "../repositories/pedidoRepository.js";
import clienteRepository from "../repositories/clienteRepository.js";

class ReporteService {
  async obtenerVentasDiarias(fecha, restauranteId) {
    const fechaBase = fecha ? new Date(`${fecha}T12:00:00`) : new Date();
    const fechaInicio = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), 0, 0, 0);
    const fechaFin = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), 23, 59, 59, 999);
    const pedidos = await pedidoRepository.obtenerPorFecha(fechaInicio, fechaFin, restauranteId);
    const totalVentas = pedidos.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);
    return {
      titulo: `Reporte Diario (${fechaInicio.toLocaleDateString()})`,
      totalVentas,
      cantidadPedidos: pedidos.length,
      fecha: fechaInicio,
      detalle: pedidos
    };
  }

  async obtenerVentasSemanales(fechaInicio, restauranteId) {
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    fin.setHours(23, 59, 59, 999);
    return this.#procesarReporte(await pedidoRepository.obtenerPorFecha(inicio, fin, restauranteId), `Reporte Semanal (${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()})`);
  }

  async obtenerVentasMensuales(anio, mes, restauranteId) {
    const year = Number(anio || new Date().getFullYear());
    const month = Number(mes || (new Date().getMonth() + 1));
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 0, 23, 59, 59, 999);
    return this.#procesarReporte(await pedidoRepository.obtenerPorFecha(inicio, fin, restauranteId), `Reporte Mensual (${month}/${year})`);
  }

  async obtenerReporteCliente(idCliente, restauranteId) {
    const pedidos = await pedidoRepository.obtenerPorCliente(idCliente, restauranteId);
    const cliente = await clienteRepository.obtenerPorId(idCliente, restauranteId);
    return this.#procesarReporte(pedidos, `Historial: ${cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente"}`);
  }

  async obtenerProductosMasVendidos(fechaInicio, fechaFin, limite, restauranteId) {
    const limitNum = Number(limite || 5);
    return sequelize.query(
      `SELECT p.nombre, SUM(pp.cantidad) as total_vendido, SUM(pp.subtotal) as total_ingresos
       FROM pedido_producto pp
       JOIN producto p ON pp.id_producto = p.id
       JOIN pedido ped ON pp.id_pedido = ped.id
       WHERE ped.estado != 'cancelado'
       AND ped.restaurante_id = :restauranteId
       ${fechaInicio && fechaFin ? "AND ped.fecha BETWEEN :fechaInicio AND :fechaFin" : ""}
       GROUP BY p.id, p.nombre
       ORDER BY total_vendido DESC
       LIMIT :limitNum`,
      {
        replacements: {
          restauranteId,
          limitNum,
          fechaInicio: `${fechaInicio} 00:00:00`,
          fechaFin: `${fechaFin} 23:59:59`
        },
        type: sequelize.QueryTypes.SELECT
      }
    );
  }

  async obtenerProductosMenosVendidos(fechaInicio, fechaFin, limite, restauranteId) {
    const limitNum = Number(limite || 5);
    return sequelize.query(
      `SELECT p.nombre, COALESCE(SUM(pp.cantidad), 0) as total_vendido
       FROM producto p
       LEFT JOIN pedido_producto pp ON pp.id_producto = p.id AND pp.restaurante_id = :restauranteId
       LEFT JOIN pedido ped ON ped.id = pp.id_pedido
         AND ped.restaurante_id = :restauranteId
         AND ped.estado != 'cancelado'
         ${fechaInicio && fechaFin ? "AND ped.fecha BETWEEN :fechaInicio AND :fechaFin" : ""}
       WHERE p.restaurante_id = :restauranteId AND p.disponible = true
       GROUP BY p.id, p.nombre
       ORDER BY total_vendido ASC, p.nombre ASC
       LIMIT :limitNum`,
      {
        replacements: {
          restauranteId,
          limitNum,
          fechaInicio: `${fechaInicio} 00:00:00`,
          fechaFin: `${fechaFin} 23:59:59`
        },
        type: sequelize.QueryTypes.SELECT
      }
    );
  }

  async obtenerClientesFrecuentes(limite, restauranteId) {
    const limitNum = Number(limite || 5);
    return sequelize.query(
      `SELECT c.nombre, c.apellido, COUNT(p.id) as cantidad_pedidos, SUM(p.total) as total_gastado
       FROM pedido p
       JOIN cliente c ON p.id_cliente = c.id
       WHERE p.estado != 'cancelado' AND p.restaurante_id = :restauranteId
       GROUP BY c.id, c.nombre, c.apellido
       ORDER BY cantidad_pedidos DESC
       LIMIT :limitNum`,
      {
        replacements: { restauranteId, limitNum },
        type: sequelize.QueryTypes.SELECT
      }
    );
  }

  async obtenerDesempenoRepartidores(fecha, restauranteId) {
    const targetDate = fecha ? new Date(fecha) : new Date();
    const fechaInicio = `${targetDate.toISOString().split("T")[0]} 00:00:00`;
    const fechaFin = `${targetDate.toISOString().split("T")[0]} 23:59:59`;
    return sequelize.query(
      `SELECT r.nombre, r.apellido, COUNT(p.id) as cantidad_entregas
       FROM repartidor r
       JOIN pedido p ON p.id_repartidor = r.id
       WHERE p.estado != 'cancelado'
       AND p.restaurante_id = :restauranteId
       AND p.fecha BETWEEN :fechaInicio AND :fechaFin
       GROUP BY r.id, r.nombre, r.apellido
       ORDER BY cantidad_entregas DESC`,
      {
        replacements: { restauranteId, fechaInicio, fechaFin },
        type: sequelize.QueryTypes.SELECT
      }
    );
  }

  async obtenerCategoriasClave(fechaInicio, fechaFin, restauranteId) {
    const categorias = await sequelize.query(
      `SELECT c.nombre,
              SUM(pp.cantidad) as unidades,
              SUM(pp.subtotal) as facturacion,
              SUM((pp.precio_unitario - COALESCE(p.costo, 0)) * pp.cantidad) as margen
       FROM categoria c
       JOIN producto p ON p.id_categoria = c.id AND p.restaurante_id = c.restaurante_id
       JOIN pedido_producto pp ON pp.id_producto = p.id AND pp.restaurante_id = c.restaurante_id
       JOIN pedido ped ON ped.id = pp.id_pedido AND ped.restaurante_id = c.restaurante_id
       WHERE c.restaurante_id = :restauranteId
       AND ped.estado != 'cancelado'
       ${fechaInicio && fechaFin ? "AND ped.fecha BETWEEN :fechaInicio AND :fechaFin" : ""}
       GROUP BY c.id, c.nombre
       ORDER BY facturacion DESC`,
      {
        replacements: {
          restauranteId,
          fechaInicio: `${fechaInicio} 00:00:00`,
          fechaFin: `${fechaFin} 23:59:59`
        },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const masVendida = categorias[0] || null;
    const masRentable = [...categorias].sort((a, b) => Number(b.margen || 0) - Number(a.margen || 0))[0] || null;
    return { masVendida, masRentable };
  }

  async obtenerVentasPorHora(fecha, restauranteId) {
    const targetDate = fecha || new Date().toISOString().split("T")[0];
    return sequelize.query(
      `SELECT LPAD(CAST(EXTRACT(HOUR FROM fecha) AS TEXT), 2, '0') as hora,
              COUNT(*) as pedidos,
              SUM(total) as total
       FROM pedido
       WHERE restaurante_id = :restauranteId
       AND estado != 'cancelado'
       AND fecha BETWEEN :fechaInicio AND :fechaFin
       GROUP BY EXTRACT(HOUR FROM fecha)
       ORDER BY EXTRACT(HOUR FROM fecha) ASC`,
      {
        replacements: {
          restauranteId,
          fechaInicio: `${targetDate} 00:00:00`,
          fechaFin: `${targetDate} 23:59:59`
        },
        type: sequelize.QueryTypes.SELECT
      }
    );
  }

  async obtenerDashboardSupervivencia(restauranteId) {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const fechaHoy = hoy.toISOString().split("T")[0];
    const fechaAyer = ayer.toISOString().split("T")[0];

    const [ventasHoy, ventasAyer, topProductos, productosLentos, categorias, ventasPorHora] = await Promise.all([
      this.obtenerVentasDiarias(fechaHoy, restauranteId),
      this.obtenerVentasDiarias(fechaAyer, restauranteId),
      this.obtenerProductosMasVendidos(fechaHoy, fechaHoy, 5, restauranteId),
      this.obtenerProductosMenosVendidos(fechaHoy, fechaHoy, 5, restauranteId),
      this.obtenerCategoriasClave(fechaHoy, fechaHoy, restauranteId),
      this.obtenerVentasPorHora(fechaHoy, restauranteId)
    ]);

    const totalHoy = Number(ventasHoy.totalVentas || 0);
    const totalAyer = Number(ventasAyer.totalVentas || 0);
    return {
      facturacionHoy: totalHoy,
      facturacionAyer: totalAyer,
      variacionFacturacion: totalAyer === 0 ? 100 : ((totalHoy - totalAyer) / totalAyer) * 100,
      ticketPromedio: ventasHoy.cantidadPedidos ? totalHoy / ventasHoy.cantidadPedidos : 0,
      topProductos,
      productosLentos,
      categorias,
      ventasPorHora
    };
  }

  async generarPDFReporte(tipo, parametros, restauranteId) {
    let datos;
    switch (tipo) {
      case "diario":
        datos = await this.obtenerVentasDiarias(parametros.fecha, restauranteId);
        break;
      case "semanal":
        datos = await this.obtenerVentasSemanales(parametros.fechaInicio, restauranteId);
        break;
      case "mensual":
        datos = await this.obtenerVentasMensuales(parametros.anio, parametros.mes, restauranteId);
        break;
      case "cliente":
        datos = await this.obtenerReporteCliente(parametros.idCliente, restauranteId);
        break;
      default:
        throw new Error("Tipo inválido");
    }

    const doc = new PDFDocument({ margin: 50 });
    doc.fontSize(20).text("Resto Bar La Esquina", { align: "center" });
    doc.fontSize(12).text("Reporte Oficial", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(datos.titulo || "Reporte", { underline: true });
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(12).text(`Pedidos: ${datos.cantidadPedidos}`);
    doc.text(`Total: $${Number(datos.totalVentas || 0).toFixed(2)}`);
    doc.end();
    return doc;
  }

  #procesarReporte(pedidosEntidad, titulo) {
    const pedidos = pedidosEntidad.map((pedido) => {
      const json = pedido.toJSON ? pedido.toJSON() : pedido;
      return {
        id: json.id,
        fecha: json.fecha,
        total: parseFloat(json.total || 0).toFixed(2),
        estado: json.estado,
        cliente: json.cliente ? `${json.cliente.nombre} ${json.cliente.apellido}` : "Final"
      };
    });

    return {
      titulo,
      cantidadPedidos: pedidos.length,
      detalle: pedidos,
      totalVentas: pedidos.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0)
    };
  }
}

export default new ReporteService();
