import express from "express";
import clienteService from "../services/clienteService.js";
import { verificarPermiso } from "../middleware/autenticacion.js";

const router = express.Router();

router.get("/", verificarPermiso("pedidos.crear", "clientes.gestionar"), async (req, res) => {
  try {
    res.json(await clienteService.obtenerTodos(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/buscar/:nombre", verificarPermiso("pedidos.crear", "clientes.gestionar"), async (req, res) => {
  try {
    res.json(await clienteService.buscarPorNombre(req.params.nombre, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", verificarPermiso("pedidos.crear", "clientes.gestionar"), async (req, res) => {
  try {
    const cliente = await clienteService.obtenerPorId(parseInt(req.params.id), req.usuario.restauranteId);
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", verificarPermiso("pedidos.crear", "clientes.gestionar"), async (req, res) => {
  try {
    res.status(201).json(await clienteService.crear(req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/importar-contactos", verificarPermiso("clientes.gestionar"), async (req, res) => {
  try {
    res.status(201).json(await clienteService.importarContactosCsv(req.body.csv, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", verificarPermiso("clientes.gestionar"), async (req, res) => {
  try {
    res.json(await clienteService.actualizar(parseInt(req.params.id), req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", verificarPermiso("clientes.gestionar"), async (req, res) => {
  try {
    await clienteService.eliminar(parseInt(req.params.id), req.usuario.restauranteId);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
