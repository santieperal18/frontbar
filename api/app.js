import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import sequelize from "./db.js";
import authRouter from "./routes/auth.routes.js";
import clientesRouter from "./routes/clientes.routes.js";
import productosRouter from "./routes/productos.routes.js";
import pedidosRouter from "./routes/pedidos.routes.js";
import repartidoresRouter from "./routes/repartidores.routes.js";
import categoriasRouter from "./routes/categorias.routes.js";
import reportesRouter from "./routes/reportes.routes.js";
import operacionesRouter from "./routes/operaciones.routes.js";
import { verificarToken, registrarAcceso } from "./middleware/autenticacion.js";
import usuarioService from "./services/usuarioService.js";
import mesaService from "./services/mesaService.js";
import categoriaService from "./services/categoriaService.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const SHOULD_ALTER_SCHEMA = process.env.DB_SYNC_ALTER
  ? process.env.DB_SYNC_ALTER === "true"
  : true;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "https://bar-production-84b0.up.railway.app"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => NODE_ENV === "development"
});

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(registrarAcceso);
app.use("/api/", apiLimiter);

app.get("/", (req, res) => {
  res.send("Resto Bar API");
});

app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      ok: true,
      dialect: sequelize.getDialect(),
      autoMigrate: SHOULD_ALTER_SCHEMA
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/clientes", verificarToken, clientesRouter);
app.use("/api/productos", verificarToken, productosRouter);
app.use("/api/pedidos", verificarToken, pedidosRouter);
app.use("/api/repartidores", verificarToken, repartidoresRouter);
app.use("/api/categorias", verificarToken, categoriasRouter);
app.use("/api/reportes", verificarToken, reportesRouter);
app.use("/api/operaciones", verificarToken, operacionesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl, method: req.method });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({
    error: NODE_ENV === "production" ? "Error interno del servidor" : err.message
  });
});

(async function start() {
  try {
    await sequelize.authenticate();
    console.log(`BD conectada con dialecto ${sequelize.getDialect()}`);
    await sequelize.sync({ alter: SHOULD_ALTER_SCHEMA });
    console.log(`Modelos sincronizados (alter=${SHOULD_ALTER_SCHEMA})`);
    const restaurante = await usuarioService.crearUsuarioOwner();
    await mesaService.inicializar(restaurante.id, 12);
    await categoriaService.asegurarCategoriasBase(restaurante.id);
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error crítico al iniciar:", error.message);
    process.exit(1);
  }
})();

export default app;
