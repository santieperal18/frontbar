import axios from "./axios.config.js";

const obtenerTodos = async () => {
  const response = await axios.get("/clientes");
  return response.data;
};

const obtenerPorId = async (id) => {
  const response = await axios.get(`/clientes/${id}`);
  return response.data;
};

const buscarPorNombre = async (nombre) => {
  const response = await axios.get(`/clientes/buscar/${nombre}`);
  return response.data;
};

const crear = async (cliente) => {
  const response = await axios.post("/clientes", cliente);
  return response.data;
};

const actualizar = async (id, cliente) => {
  const response = await axios.put(`/clientes/${id}`, cliente);
  return response.data;
};

const eliminar = async (id) => {
  await axios.delete(`/clientes/${id}`);
};

export default {
  obtenerTodos,
  obtenerPorId,
  buscarPorNombre,
  crear,
  actualizar,
  eliminar
};