import express from "express";
import repartidorService from "../services/repartidorService.js";
import { verificarPermiso } from "../middleware/autenticacion.js";

const router = express.Router();

router.get("/", verificarPermiso("pedidos.crear", "repartos.ver"), async (req, res) => {
  try {
    res.json(await repartidorService.obtenerTodos(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/disponibles", verificarPermiso("pedidos.crear", "repartos.ver"), async (req, res) => {
  try {
    res.json(await repartidorService.obtenerDisponibles(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/buscar/:nombre", verificarPermiso("pedidos.crear", "repartos.ver"), async (req, res) => {
  try {
    res.json(await repartidorService.buscarPorNombre(req.params.nombre, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", verificarPermiso("pedidos.crear", "repartos.ver"), async (req, res) => {
  try {
    const repartidor = await repartidorService.obtenerPorId(parseInt(req.params.id), req.usuario.restauranteId);
    if (!repartidor) return res.status(404).json({ error: "Repartidor no encontrado" });
    res.json(repartidor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", verificarPermiso("repartos.ver"), async (req, res) => {
  try {
    res.status(201).json(await repartidorService.crear(req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", verificarPermiso("repartos.ver"), async (req, res) => {
  try {
    res.json(await repartidorService.actualizar(parseInt(req.params.id), req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", verificarPermiso("repartos.ver"), async (req, res) => {
  try {
    await repartidorService.eliminar(parseInt(req.params.id), req.usuario.restauranteId);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
