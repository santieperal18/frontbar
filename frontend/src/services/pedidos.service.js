import axios from "./axios.config.js";

const obtenerTodos = async ({ pagina, limite } = {}) => {
  const params = {};
  if (pagina) params.pagina = pagina;
  if (limite) params.limite = limite;
  
  const response = await axios.get("/pedidos", { params });
  return response.data;
};

const obtenerPorId = async (id) => {
  const response = await axios.get(`/pedidos/${id}`);
  return response.data;
};

const obtenerPorCliente = async (idCliente) => {
  const response = await axios.get(`/pedidos/cliente/${idCliente}`);
  return response.data;
};

const buscarFiltrado = async (filtros) => {
  const params = {};
  
  // Añadir solo los filtros con valor
  if (filtros.cliente) params.cliente = filtros.cliente;
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.tipoEntrega) params.tipoEntrega = filtros.tipoEntrega;
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
  
  const response = await axios.get("/pedidos/filtrar/buscar", { params });
  return response.data;
};

const crear = async (pedido) => {
  const response = await axios.post("/pedidos", pedido);
  return response.data;
};

const actualizar = async (id, pedido) => {
  const response = await axios.put(`/pedidos/${id}`, pedido);
  return response.data;
};

const actualizarEstado = async (id, estado) => {
  const response = await axios.patch(`/pedidos/${id}/estado`, { estado });
  return response.data;
};

const eliminar = async (id) => {
  await axios.delete(`/pedidos/${id}`);
};

export default {
  obtenerTodos,
  obtenerPorId,
  obtenerPorCliente,
  buscarFiltrado,
  crear,
  actualizar,
  actualizarEstado,
  eliminar
};