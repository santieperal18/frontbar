import PDFDocument from "pdfkit";
import { QueryTypes } from "sequelize";
import sequelize from "../db.js";
import pedidoRepository from "../repositories/pedidoRepository.js";
import clienteRepository from "../repositories/clienteRepository.js";
import { addBusinessDays, getBusinessDateRange, getBusinessDateString } from "../utils/dateUtils.js";

const BUSINESS_TIMEZONE_OFFSET_MINUTES = Number(process.env.BUSINESS_TIMEZONE_OFFSET_MINUTES || -180);

class ReporteService {
  async obtenerVentasDiarias(fecha, restauranteId) {
    const fechaDia = fecha || getBusinessDateString();
    const { start: fechaInicio, end: fechaFin } = getBusinessDateRange(fechaDia);
    const pedidos = await pedidoRepository.obtenerPorFecha(fechaInicio, fechaFin, restauranteId);
    const totalVentas = pedidos.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);
    return {
      titulo: `Reporte Diario (${fechaDia})`,
      totalVentas,
      cantidadPedidos: pedidos.length,
      fecha: fechaInicio,
      detalle: pedidos
    };
  }

  async obtenerVentasSemanales(fechaInicio, restauranteId) {
    const fechaDesde = fechaInicio || getBusinessDateString();
    const fechaHasta = addBusinessDays(fechaDesde, 6);
    const { start: inicio } = getBusinessDateRange(fechaDesde);
    const { end: fin } = getBusinessDateRange(fechaHasta);
    return this.#procesarReporte(await pedidoRepository.obtenerPorFecha(inicio, fin, restauranteId), `Reporte Semanal (${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()})`);
  }

  async obtenerVentasMensuales(anio, mes, restauranteId) {
    const [businessYear, businessMonth] = getBusinessDateString().split("-").map(Number);
    const year = Number(anio || businessYear);
    const month = Number(mes || businessMonth);
    const fechaDesde = `${year}-${String(month).padStart(2, "0")}-01`;
    const ultimoDia = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const fechaHasta = `${year}-${String(month).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    const { start: inicio } = getBusinessDateRange(fechaDesde);
    const { end: fin } = getBusinessDateRange(fechaHasta);
    return this.#procesarReporte(await pedidoRepository.obtenerPorFecha(inicio, fin, restauranteId), `Reporte Mensual (${month}/${year})`);
  }

  async obtenerReporteCliente(idCliente, restauranteId) {
    const pedidos = await pedidoRepository.obtenerPorCliente(idCliente, restauranteId);
    const cliente = await clienteRepository.obtenerPorId(idCliente, restauranteId);
    return this.#procesarReporte(pedidos, `Historial: ${cliente ? `${cliente.nombre} ${cliente.apellido}` : "Cliente"}`);
  }

  async obtenerProductosMasVendidos(fechaInicio, fechaFin, limite, restauranteId) {
    const limitNum = Number(limite || 5);
    const rango = fechaInicio && fechaFin ? {
      fechaInicio: getBusinessDateRange(fechaInicio).start,
      fechaFin: getBusinessDateRange(fechaFin).end
    } : {};
    return sequelize.query(
      `SELECT p.nombre, SUM(pp.cantidad) as total_vendido, SUM(pp.subtotal) as total_ingresos
       FROM pedido_producto pp
       JOIN producto p ON pp.id_producto = p.id AND p.restaurante_id = pp.restaurante_id
       JOIN pedido ped ON pp.id_pedido = ped.id AND ped.restaurante_id = pp.restaurante_id
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
          ...rango
        },
        type: QueryTypes.SELECT
      }
    );
  }

  async obtenerProductosMenosVendidos(fechaInicio, fechaFin, limite, restauranteId) {
    const limitNum = Number(limite || 5);
    const rango = fechaInicio && fechaFin ? {
      fechaInicio: getBusinessDateRange(fechaInicio).start,
      fechaFin: getBusinessDateRange(fechaFin).end
    } : {};
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
          ...rango
        },
        type: QueryTypes.SELECT
      }
    );
  }

  async obtenerClientesFrecuentes(limite, restauranteId) {
    const limitNum = Number(limite || 5);
    return sequelize.query(
      `SELECT c.nombre, c.apellido, COUNT(p.id) as cantidad_pedidos, SUM(p.total) as total_gastado
       FROM pedido p
       JOIN cliente c ON p.id_cliente = c.id AND c.restaurante_id = p.restaurante_id
       WHERE p.estado != 'cancelado' AND p.restaurante_id = :restauranteId
       GROUP BY c.id, c.nombre, c.apellido
       ORDER BY cantidad_pedidos DESC
       LIMIT :limitNum`,
      {
        replacements: { restauranteId, limitNum },
        type: QueryTypes.SELECT
      }
    );
  }

  async obtenerDesempenoRepartidores(fecha, restauranteId) {
    const { start: fechaInicio, end: fechaFin } = getBusinessDateRange(fecha || getBusinessDateString());
    return sequelize.query(
      `SELECT r.nombre, r.apellido, COUNT(p.id) as cantidad_entregas
       FROM repartidor r
       JOIN pedido p ON p.id_repartidor = r.id AND p.restaurante_id = r.restaurante_id
       WHERE p.estado != 'cancelado'
       AND p.restaurante_id = :restauranteId
       AND p.fecha BETWEEN :fechaInicio AND :fechaFin
       GROUP BY r.id, r.nombre, r.apellido
       ORDER BY cantidad_entregas DESC`,
      {
        replacements: { restauranteId, fechaInicio, fechaFin },
        type: QueryTypes.SELECT
      }
    );
  }

  async obtenerCategoriasClave(fechaInicio, fechaFin, restauranteId) {
    const rango = fechaInicio && fechaFin ? {
      fechaInicio: getBusinessDateRange(fechaInicio).start,
      fechaFin: getBusinessDateRange(fechaFin).end
    } : {};
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
          ...rango
        },
        type: QueryTypes.SELECT
      }
    );

    const masVendida = categorias[0] || null;
    const masRentable = [...categorias].sort((a, b) => Number(b.margen || 0) - Number(a.margen || 0))[0] || null;
    return { masVendida, masRentable };
  }

  async obtenerVentasPorHora(fecha, restauranteId) {
    const targetDate = fecha || getBusinessDateString();
    const { start: fechaInicio, end: fechaFin } = getBusinessDateRange(targetDate);
    return sequelize.query(
      `SELECT TO_CHAR(fecha + (:offsetMinutes * INTERVAL '1 minute'), 'HH24') as hora,
              COUNT(*) as pedidos,
              SUM(total) as total
       FROM pedido
       WHERE restaurante_id = :restauranteId
       AND estado != 'cancelado'
       AND fecha BETWEEN :fechaInicio AND :fechaFin
       GROUP BY TO_CHAR(fecha + (:offsetMinutes * INTERVAL '1 minute'), 'HH24')
       ORDER BY TO_CHAR(fecha + (:offsetMinutes * INTERVAL '1 minute'), 'HH24') ASC`,
      {
        replacements: {
          restauranteId,
          fechaInicio,
          fechaFin,
          offsetMinutes: BUSINESS_TIMEZONE_OFFSET_MINUTES
        },
        type: QueryTypes.SELECT
      }
    );
  }

  async obtenerDashboardSupervivencia(restauranteId) {
    const fechaHoy = getBusinessDateString();
    const fechaAyer = addBusinessDays(fechaHoy, -1);

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
