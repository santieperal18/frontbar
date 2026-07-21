import Restaurante from "../models/restaurante.js";
import { Impresora, MetodoPago } from "../models/configuracion.js";
import mesaRepository from "../repositories/mesaRepository.js";
import categoriaService from "./categoriaService.js";
import productoService from "./productoService.js";
import clienteService from "./clienteService.js";
import productoRepository from "../repositories/productoRepository.js";
import usuarioRepository from "../repositories/usuarioRepository.js";
import Pedido from "../models/pedido.js";
import { Op } from "sequelize";

const CAMPOS_RESTAURANTE = ["nombre", "moneda", "pais", "zonaHoraria", "porcentajeImpuesto", "razonSocial", "identificacionFiscal", "direccion", "telefono", "emailComercial", "logoUrl"];
const TIPOS_CATEGORIA = new Set(["desayuno", "comida", "bebida"]);

class OnboardingService {
  async obtener(restauranteId) {
    const restaurante = await Restaurante.findByPk(restauranteId, { include: [{ model: MetodoPago, as: "metodosPago" }, { model: Impresora, as: "impresoras" }] });
    if (!restaurante) throw new Error("Restaurante no encontrado");
    const [mesas, categorias, productos, usuarios] = await Promise.all([mesaRepository.obtenerTodas(restauranteId), categoriaService.obtenerTodos(restauranteId), productoRepository.contarTodos(restauranteId), usuarioRepository.contarTodos(restauranteId)]);
    const pasos = [
      { clave: "negocio", titulo: "Datos del negocio", listo: Boolean(restaurante.nombre && restaurante.moneda && restaurante.zonaHoraria) },
      { clave: "mesas", titulo: "Mesas", listo: mesas.length > 0 },
      { clave: "categorias", titulo: "Categorías", listo: categorias.length > 0 },
      { clave: "productos", titulo: "Productos", listo: productos > 0 },
      { clave: "pagos", titulo: "Métodos de pago", listo: restaurante.metodosPago.length > 0 },
      { clave: "impresoras", titulo: "Impresoras", listo: restaurante.impresoras.length > 0 },
      { clave: "equipo", titulo: "Equipo", listo: usuarios > 0 }
    ];
    return { restaurante, mesas, categorias, pasos, completado: restaurante.onboardingCompletado };
  }

  async actualizarNegocio(restauranteId, datos) {
    const restaurante = await Restaurante.findByPk(restauranteId);
    if (!restaurante) throw new Error("Restaurante no encontrado");
    const cambios = Object.fromEntries(CAMPOS_RESTAURANTE.filter((campo) => datos[campo] !== undefined).map((campo) => [campo, datos[campo]]));
    if (cambios.nombre !== undefined && String(cambios.nombre).trim().length < 2) throw new Error("El nombre comercial debe tener al menos 2 caracteres");
    if (cambios.porcentajeImpuesto !== undefined && (Number(cambios.porcentajeImpuesto) < 0 || Number(cambios.porcentajeImpuesto) > 100)) throw new Error("El impuesto debe estar entre 0 y 100");
    if (cambios.logoUrl && !String(cambios.logoUrl).startsWith("data:image/") && !/^https?:\/\//.test(cambios.logoUrl)) throw new Error("El logo debe ser una imagen o una URL válida");
    await restaurante.update(cambios);
    return restaurante;
  }

  async configurarMesas(restauranteId, cantidad) {
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 0 || numero > 250) throw new Error("La cantidad de mesas debe estar entre 0 y 250");
    const actuales = await mesaRepository.obtenerTodas(restauranteId);
    const existentes = new Set(actuales.map((mesa) => mesa.numero));
    const sobrantes = actuales.filter((mesa) => mesa.numero > numero);
    if (sobrantes.length) {
      const ocupadas = sobrantes.filter((mesa) => mesa.estado !== "libre");
      if (ocupadas.length) throw new Error(`No se pueden quitar las mesas ocupadas: ${ocupadas.map((mesa) => mesa.numero).join(", ")}`);
      const ids = sobrantes.map((mesa) => mesa.id);
      const pedidosAsociados = await Pedido.count({ where: { restauranteId, idMesa: { [Op.in]: ids } } });
      if (pedidosAsociados) throw new Error("No se pueden quitar mesas que tienen pedidos registrados. Conservá esas mesas o eliminá los pedidos de prueba.");
      for (const mesa of sobrantes) await mesaRepository.eliminar(mesa.id, restauranteId);
    }
    const nuevas = [];
    for (let i = 1; i <= numero; i += 1) if (!existentes.has(i)) nuevas.push({ numero: i, estado: "libre" });
    for (const mesa of nuevas) await mesaRepository.crear(mesa, restauranteId);
    return mesaRepository.obtenerTodas(restauranteId);
  }

  async guardarCategorias(restauranteId, categorias) {
    if (!Array.isArray(categorias) || !categorias.length) throw new Error("Ingresá al menos una categoría");
    const creadas = [];
    for (const item of categorias) {
      const nombre = String(item.nombre || "").trim();
      if (!nombre) continue;
      const existentes = await categoriaService.obtenerTodos(restauranteId);
      const encontrada = existentes.find((categoria) => categoria.nombre.toLowerCase() === nombre.toLowerCase());
      creadas.push(encontrada || await categoriaService.crear({ nombre, tipo: TIPOS_CATEGORIA.has(item.tipo) ? item.tipo : "comida", descripcion: item.descripcion || null }, restauranteId));
    }
    return creadas;
  }

  async importarProductos(restauranteId, productos) {
    if (!Array.isArray(productos) || !productos.length) throw new Error("No hay productos para importar");
    const resultado = { leidos: productos.length, importados: 0, omitidos: 0, errores: [] };
    for (const [indice, fila] of productos.entries()) {
      try {
        const nombre = String(fila.nombre || fila.name || "").trim();
        const categoriaNombre = String(fila.categoria || fila.category || "General").trim();
        const precio = Number(String(fila.precioMostrador ?? fila.precio ?? fila.price ?? "").replace(",", "."));
        if (!nombre || !Number.isFinite(precio) || precio < 0) throw new Error("Nombre o precio inválido");
        const categorias = await categoriaService.obtenerTodos(restauranteId);
        let categoria = categorias.find((item) => item.nombre.toLowerCase() === categoriaNombre.toLowerCase());
        if (!categoria) categoria = await categoriaService.crear({ nombre: categoriaNombre, tipo: "comida" }, restauranteId);
        await productoService.crear({ nombre, descripcion: fila.descripcion || fila.description || null, idCategoria: categoria.id, precioMostrador: precio, precioSalon: Number(String(fila.precioSalon ?? fila.precio_salon ?? precio).replace(",", ".")), costo: Number(String(fila.costo ?? fila.cost ?? 0).replace(",", ".")), controlaStock: Boolean(fila.controlaStock || fila.controla_stock), stockActual: Number(fila.stockActual ?? fila.stock_actual ?? 0) }, restauranteId);
        resultado.importados += 1;
      } catch (error) { resultado.omitidos += 1; resultado.errores.push({ fila: indice + 2, error: error.message }); }
    }
    return resultado;
  }

  async importarClientes(restauranteId, csv) { return clienteService.importarContactosCsv(csv, restauranteId); }
  async guardarMetodosPago(restauranteId, metodos) {
    if (!Array.isArray(metodos) || !metodos.length) throw new Error("Agregá al menos un método de pago");
    await MetodoPago.destroy({ where: { restauranteId } });
    return Promise.all(metodos.filter((item) => item.nombre).map((item) => MetodoPago.create({ restauranteId, nombre: String(item.nombre).trim(), tipo: item.tipo || "efectivo", activo: item.activo !== false, requiereReferencia: Boolean(item.requiereReferencia) })));
  }
  async guardarImpresoras(restauranteId, impresoras) {
    if (!Array.isArray(impresoras)) throw new Error("Las impresoras son inválidas");
    await Impresora.destroy({ where: { restauranteId } });
    return Promise.all(impresoras.filter((item) => item.nombre).map((item) => Impresora.create({ restauranteId, nombre: String(item.nombre).trim(), destino: item.destino || "cocina", tipoConexion: item.tipoConexion || "red", direccion: item.direccion || null, activa: item.activa !== false })));
  }
  async completar(restauranteId) { const restaurante = await Restaurante.findByPk(restauranteId); await restaurante.update({ onboardingCompletado: true, onboardingPaso: "completado" }); return { mensaje: "Configuración inicial completada" }; }
}

export default new OnboardingService();
