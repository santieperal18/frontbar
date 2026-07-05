import express from "express";
import pedidoService from "../services/pedidoService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json(await pedidoService.obtenerTodos(req.query, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pedido = await pedidoService.obtenerPorId(parseInt(req.params.id), req.usuario.restauranteId);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/cliente/:idCliente", async (req, res) => {
  try {
    res.json(await pedidoService.obtenerPorCliente(parseInt(req.params.idCliente), req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/filtrar/buscar", async (req, res) => {
  try {
    res.json(await pedidoService.filtrar(req.query, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await pedidoService.crear(req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await pedidoService.actualizar(parseInt(req.params.id), req.body, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id/estado", async (req, res) => {
  try {
    res.json(await pedidoService.actualizarEstado(parseInt(req.params.id), req.body.estado, req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id/pedir-cuenta", async (req, res) => {
  try {
    res.json(await pedidoService.marcarPidiendoCuenta(parseInt(req.params.id), req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pedidoService.eliminar(parseInt(req.params.id), req.usuario.restauranteId);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
