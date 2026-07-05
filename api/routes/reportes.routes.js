import express from "express";
import reporteService from "../services/reporteService.js";

const router = express.Router();

router.get("/ventas/diarias", async (req, res) => {
  try {
    res.json(await reporteService.obtenerVentasDiarias(req.query.fecha, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ventas/semanales", async (req, res) => {
  try {
    res.json(await reporteService.obtenerVentasSemanales(req.query.fechaInicio, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ventas/mensuales", async (req, res) => {
  try {
    res.json(await reporteService.obtenerVentasMensuales(req.query.anio, req.query.mes, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/productos/mas-vendidos", async (req, res) => {
  try {
    res.json(await reporteService.obtenerProductosMasVendidos(req.query.fechaInicio, req.query.fechaFin, req.query.limite, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/clientes/frecuentes", async (req, res) => {
  try {
    res.json(await reporteService.obtenerClientesFrecuentes(req.query.limite, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/repartidores/desempeno", async (req, res) => {
  try {
    res.json(await reporteService.obtenerDesempenoRepartidores(req.query.fecha, req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard/supervivencia", async (req, res) => {
  try {
    res.json(await reporteService.obtenerDashboardSupervivencia(req.usuario.restauranteId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pdf", async (req, res) => {
  try {
    const doc = await reporteService.generarPDFReporte(req.body.tipo, req.body.parametros, req.usuario.restauranteId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reporte-${req.body.tipo}.pdf`);
    doc.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
