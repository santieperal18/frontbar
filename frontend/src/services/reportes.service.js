import axios from "./axios.config.js";

const obtenerVentasDiarias = async (fecha) => {
  const params = fecha ? { fecha } : {};
  const response = await axios.get("/reportes/ventas/diarias", { params });
  return response.data;
};

const obtenerVentasMensuales = async (anio, mes) => {
  const params = { anio, mes };
  const response = await axios.get("/reportes/ventas/mensuales", { params });
  return response.data;
};

const obtenerProductosMasVendidos = async (fechaInicio = null, fechaFin = null, limite = 5) => {
  const params = { limite };
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;
  
  const response = await axios.get("/reportes/productos/mas-vendidos", { params });
  return response.data;
};

const obtenerClientesFrecuentes = async (limite = 5) => {
  const params = { limite };
  const response = await axios.get("/reportes/clientes/frecuentes", { params });
  return response.data;
};

// NUEVO: Función para llamar al backend de repartidores
const obtenerDesempenoRepartidores = async (fecha) => {
  const params = fecha ? { fecha } : {};
  const response = await axios.get("/reportes/repartidores/desempeno", { params });
  return response.data;
};

const generarPDF = async (tipo, parametros) => {
  const response = await axios.post("/reportes/pdf", { tipo, parametros }, { responseType: 'blob' });
  return response.data;
};

export default {
  obtenerVentasDiarias,
  obtenerVentasMensuales,
  obtenerProductosMasVendidos,
  obtenerClientesFrecuentes,
  obtenerDesempenoRepartidores,
  generarPDF
};