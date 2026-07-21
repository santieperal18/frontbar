import express from "express";
import cajaService from "../services/cajaService.js";
import mesaService from "../services/mesaService.js";
import operacionService from "../services/operacionService.js";
import pedidoService from "../services/pedidoService.js";
import { verificarPermiso } from "../middleware/autenticacion.js";

const router = express.Router();

router.get("/salon", verificarPermiso("pedidos.crear", "caja.cobrar"), async (req, res) => {
  try {
    res.json(await operacionService.obtenerSalon(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/salon/mesas/:id", verificarPermiso("pedidos.editar"), async (req, res) => {
  try {
    res.json(await mesaService.actualizarEstado(parseInt(req.params.id), req.usuario.restauranteId, req.body.estado));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/cocina", verificarPermiso("cocina.ver"), async (req, res) => {
  try {
    res.json(await pedidoService.obtenerComandasCocina(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/cocina/:id/avanzar", verificarPermiso("cocina.ver"), async (req, res) => {
  try {
    res.json(await pedidoService.avanzarEstadoCocina(parseInt(req.params.id), req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/caja/turno", verificarPermiso("caja.abrir", "caja.cerrar", "caja.cobrar"), async (req, res) => {
  try {
    res.json(await cajaService.obtenerTurnoActual(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/caja/turno", verificarPermiso("caja.abrir"), async (req, res) => {
  try {
    res.status(201).json(await cajaService.abrirTurno(req.usuario.restauranteId, req.body.montoApertura));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/caja/turno/cerrar", verificarPermiso("caja.cerrar"), async (req, res) => {
  try {
    res.json(await cajaService.cerrarTurno(req.usuario.restauranteId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/caja/pedidos/:id/cobrar", verificarPermiso("caja.cobrar"), async (req, res) => {
  try {
    res.json(await cajaService.cobrarPedido(parseInt(req.params.id), req.usuario.restauranteId, req.body.pagos));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
