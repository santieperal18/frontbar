import express from "express";
import onboardingService from "../services/onboardingService.js";
import { verificarPermiso } from "../middleware/autenticacion.js";

const router = express.Router();
const responder = (handler) => async (req, res) => { try { res.json(await handler(req)); } catch (error) { res.status(error.statusCode || 400).json({ error: error.message }); } };

router.get("/", verificarPermiso("usuarios.gestionar"), responder((req) => onboardingService.obtener(req.usuario.restauranteId)));
router.put("/negocio", verificarPermiso("usuarios.gestionar"), responder((req) => onboardingService.actualizarNegocio(req.usuario.restauranteId, req.body)));
router.put("/mesas", verificarPermiso("usuarios.gestionar"), responder((req) => onboardingService.configurarMesas(req.usuario.restauranteId, req.body.cantidad)));
router.post("/categorias", verificarPermiso("productos.editar"), responder((req) => onboardingService.guardarCategorias(req.usuario.restauranteId, req.body.categorias)));
router.post("/importar-productos", verificarPermiso("productos.editar"), responder((req) => onboardingService.importarProductos(req.usuario.restauranteId, req.body.productos)));
router.post("/importar-clientes", verificarPermiso("clientes.gestionar"), responder((req) => onboardingService.importarClientes(req.usuario.restauranteId, req.body.csv)));
router.put("/metodos-pago", verificarPermiso("usuarios.gestionar"), responder((req) => onboardingService.guardarMetodosPago(req.usuario.restauranteId, req.body.metodos)));
router.put("/impresoras", verificarPermiso("usuarios.gestionar"), responder((req) => onboardingService.guardarImpresoras(req.usuario.restauranteId, req.body.impresoras)));
router.post("/completar", verificarPermiso("usuarios.gestionar"), responder((req) => onboardingService.completar(req.usuario.restauranteId)));

export default router;
