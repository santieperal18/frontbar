import axios from "./axios.config.js";

const obtenerTodos = async () => {
  const response = await axios.get("/categorias");
  return response.data;
};

const obtenerPorId = async (id) => {
  const response = await axios.get(`/categorias/${id}`);
  return response.data;
};

const obtenerPorTipo = async (tipo) => {
  const response = await axios.get(`/categorias/tipo/${tipo}`);
  return response.data;
};

const crear = async (categoria) => {
  const response = await axios.post("/categorias", categoria);
  return response.data;
};

const actualizar = async (id, categoria) => {
  const response = await axios.put(`/categorias/${id}`, categoria);
  return response.data;
};

const eliminar = async (id) => {
  await axios.delete(`/categorias/${id}`);
};

export default {
  obtenerTodos,
  obtenerPorId,
  obtenerPorTipo,
  crear,
  actualizar,
  eliminar
};