import axios from "./axios.config.js";

const obtenerTodos = async () => {
  const response = await axios.get("/repartidores");
  return response.data;
};

const obtenerDisponibles = async () => {
  const response = await axios.get("/repartidores/disponibles");
  return response.data;
};

const obtenerPorId = async (id) => {
  const response = await axios.get(`/repartidores/${id}`);
  return response.data;
};

const buscarPorNombre = async (nombre) => {
  const response = await axios.get(`/repartidores/buscar/${nombre}`);
  return response.data;
};

const crear = async (repartidor) => {
  const response = await axios.post("/repartidores", repartidor);
  return response.data;
};

const actualizar = async (id, repartidor) => {
  const response = await axios.put(`/repartidores/${id}`, repartidor);
  return response.data;
};

const eliminar = async (id) => {
  await axios.delete(`/repartidores/${id}`);
};

export default {
  obtenerTodos,
  obtenerDisponibles,
  obtenerPorId,
  buscarPorNombre,
  crear,
  actualizar,
  eliminar
};