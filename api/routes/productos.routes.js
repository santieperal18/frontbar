import express from "express";
import productoService from "../services/productoService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json(await productoService.obtenerTodos(req.usuario.restauranteId, req.query.incluirOcultos === "true"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const producto = await productoService.obtenerPorId(parseInt(req.params.id), req.usuario.restauranteId);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/categoria/:idCategoria", async (req, res) => {
  try {
    res.json(await productoService.obtenerPorCategoria(parseInt(req.params.idCategoria), req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tipo/:tipo", async (req, res) => {
  try {
    res.json(await productoService.obtenerPorTipo(req.params.tipo, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await productoService.crear(req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await productoService.actualizar(parseInt(req.params.id), req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await productoService.eliminar(parseInt(req.params.id), req.usuario.restauranteId);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
