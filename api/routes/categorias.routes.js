import express from "express";
import categoriaService from "../services/categoriaService.js";
import { verificarPermiso } from "../middleware/autenticacion.js";

const router = express.Router();

router.get("/", verificarPermiso("pedidos.crear", "productos.editar"), async (req, res) => {
  try {
    res.json(await categoriaService.obtenerTodos(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tipo/:tipo", verificarPermiso("pedidos.crear", "productos.editar"), async (req, res) => {
  try {
    res.json(await categoriaService.obtenerPorTipo(req.params.tipo, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id", verificarPermiso("pedidos.crear", "productos.editar"), async (req, res) => {
  try {
    const categoria = await categoriaService.obtenerPorId(parseInt(req.params.id), req.usuario.restauranteId);
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", verificarPermiso("productos.editar"), async (req, res) => {
  try {
    res.status(201).json(await categoriaService.crear(req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", verificarPermiso("productos.editar"), async (req, res) => {
  try {
    res.json(await categoriaService.actualizar(parseInt(req.params.id), req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", verificarPermiso("productos.editar"), async (req, res) => {
  try {
    await categoriaService.eliminar(parseInt(req.params.id), req.usuario.restauranteId);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
