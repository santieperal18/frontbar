import axios from "./axios.config.js";

const obtenerTodos = async () => {
  const response = await axios.get("/productos");
  return response.data;
};

const obtenerPorId = async (id) => {
  const response = await axios.get(`/productos/${id}`);
  return response.data;
};

const obtenerPorCategoria = async (idCategoria) => {
  const response = await axios.get(`/productos/categoria/${idCategoria}`);
  return response.data;
};

const obtenerPorTipo = async (tipo) => {
  const response = await axios.get(`/productos/tipo/${tipo}`);
  return response.data;
};

const crear = async (producto) => {
  const response = await axios.post("/productos", producto);
  return response.data;
};

const actualizar = async (id, producto) => {
  const response = await axios.put(`/productos/${id}`, producto);
  return response.data;
};

const eliminar = async (id) => {
  await axios.delete(`/productos/${id}`);
};

export default {
  obtenerTodos,
  obtenerPorId,
  obtenerPorCategoria,
  obtenerPorTipo,
  crear,
  actualizar,
  eliminar
};