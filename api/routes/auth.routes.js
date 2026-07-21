import express from "express";
import { body, validationResult } from "express-validator";
import usuarioService from "../services/usuarioService.js";
import { verificarToken } from "../middleware/autenticacion.js";

const router = express.Router();
const contexto = (req) => ({ ip: req.ip, dispositivo: req.get("user-agent") });
const validar = (req, res) => { const errores = validationResult(req); if (!errores.isEmpty()) { res.status(400).json({ error: "Validación fallida", details: errores.array() }); return false; } return true; };
const cookie = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000, path: "/api/auth" };

router.post("/registro", [body("restaurante").trim().isLength({ min: 2, max: 120 }), body("usuario").trim().isLength({ min: 3, max: 50 }), body("email").isEmail(), body("contrasena").isLength({ min: 12, max: 100 })], async (req, res) => {
  try { if (!validar(req, res)) return; res.status(201).json(await usuarioService.registrarRestaurante(req.body, contexto(req))); } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/login", [body("usuario").trim().isLength({ min: 3, max: 254 }), body("contrasena").isLength({ min: 1, max: 100 }), body("codigoMfa").optional().isLength({ min: 6, max: 6 })], async (req, res) => {
  try { if (!validar(req, res)) return; const resultado = await usuarioService.login(req.body.usuario, req.body.contrasena, req.body.codigoMfa, contexto(req)); res.cookie("refreshToken", resultado.refreshToken, cookie); res.json(resultado); } catch (err) { res.status(401).json({ error: err.message }); }
});

router.post("/refresh", async (req, res) => { try { const resultado = await usuarioService.refreshToken(req.cookies.refreshToken || req.body.refreshToken, contexto(req)); res.json(resultado); } catch (err) { res.status(401).json({ error: err.message }); } });
router.post("/logout", verificarToken, async (req, res) => { await usuarioService.cerrarSesion(req.usuario.sid, req.usuario, contexto(req)); res.clearCookie("refreshToken", { path: "/api/auth" }); res.json({ mensaje: "Sesión cerrada correctamente" }); });
router.post("/recuperar-contrasena", [body("email").isEmail()], async (req, res) => { try { if (!validar(req, res)) return; res.json(await usuarioService.solicitarRecuperacion(req.body.email, contexto(req))); } catch (err) { res.status(400).json({ error: err.message }); } });
router.post("/restablecer-contrasena", [body("token").isString(), body("contrasena").isLength({ min: 12, max: 100 })], async (req, res) => { try { if (!validar(req, res)) return; res.json(await usuarioService.restablecerContrasena(req.body.token, req.body.contrasena, contexto(req))); } catch (err) { res.status(400).json({ error: err.message }); } });
router.post("/verificar-email", [body("token").isString()], async (req, res) => { try { if (!validar(req, res)) return; res.json(await usuarioService.verificarEmail(req.body.token)); } catch (err) { res.status(400).json({ error: err.message }); } });
router.post("/aceptar-invitacion", [body("token").isString(), body("contrasena").isLength({ min: 12, max: 100 })], async (req, res) => { try { if (!validar(req, res)) return; res.json(await usuarioService.aceptarInvitacion(req.body.token, req.body.contrasena, contexto(req))); } catch (err) { res.status(400).json({ error: err.message }); } });
router.post("/mfa", verificarToken, async (req, res) => { try { res.json(await usuarioService.configurarMfa(req.usuarioModelo, req.body.codigoMfa)); } catch (err) { res.status(400).json({ error: err.message }); } });
router.get("/me", verificarToken, (req, res) => res.json({ usuario: req.usuario }));

export default router;
