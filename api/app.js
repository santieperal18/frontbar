import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import sequelize, { dbState, ensureDatabaseReady, initializeDatabase, startDatabaseRetryLoop } from "./db.js";
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
  : NODE_ENV !== "production";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://bar-production-84b0.up.railway.app",
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS bloqueado para origin=${origin}`);
    return callback(new Error(`Origin no permitido por CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => NODE_ENV === "development"
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(registrarAcceso);
app.use("/api/", apiLimiter);

app.get("/", (req, res) => {
  res.send("Resto Bar API");
});

app.get("/api/health", async (req, res) => {
  res.status(dbState.ready ? 200 : 503).json({
    ok: dbState.ready,
    dialect: sequelize.getDialect(),
    autoMigrate: SHOULD_ALTER_SCHEMA,
    allowedOrigins,
    db: dbState
  });
});

app.use("/api/auth", ensureDatabaseReady, authRouter);
app.use("/api/clientes", ensureDatabaseReady, verificarToken, clientesRouter);
app.use("/api/productos", ensureDatabaseReady, verificarToken, productosRouter);
app.use("/api/pedidos", ensureDatabaseReady, verificarToken, pedidosRouter);
app.use("/api/repartidores", ensureDatabaseReady, verificarToken, repartidoresRouter);
app.use("/api/categorias", ensureDatabaseReady, verificarToken, categoriasRouter);
app.use("/api/reportes", ensureDatabaseReady, verificarToken, reportesRouter);
app.use("/api/operaciones", ensureDatabaseReady, verificarToken, operacionesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", path: req.originalUrl, method: req.method });
});

app.use((err, req, res, next) => {
  if (err?.message?.startsWith("Origin no permitido por CORS")) {
    return res.status(403).json({ error: err.message });
  }

  console.error("Error no controlado:", err);
  res.status(err.statusCode || 500).json({
    error: NODE_ENV === "production" ? "Error interno del servidor" : (err?.message || String(err))
  });
});

async function bootstrapData() {
  const restaurante = await usuarioService.crearUsuarioOwner();
  await mesaService.inicializar(restaurante.id, 12);
  await categoriaService.asegurarCategoriasBase(restaurante.id);
}

(async function start() {
  try {
    console.log("Iniciando backend...");
    console.log(`NODE_ENV=${NODE_ENV}`);
    console.log(`PORT=${PORT}`);
    console.log(`DB dialect detectado=${sequelize.getDialect()}`);
    console.log(`DB source=${sequelize.__connectionSource}`);
    console.log(`DB host=${sequelize.__connectionHost}`);
    console.log(`DATABASE_URL presente=${Boolean(process.env.DATABASE_URL)}`);
    console.log(`PGHOST presente=${Boolean(process.env.PGHOST)}`);
    console.log(`Allowed origins=${allowedOrigins.join(", ")}`);

    try {
      await initializeDatabase({ alter: SHOULD_ALTER_SCHEMA });
      console.log(`BD conectada con dialecto ${sequelize.getDialect()}`);
      console.log(`Modelos sincronizados (alter=${SHOULD_ALTER_SCHEMA})`);
      await bootstrapData();
    } catch (error) {
      console.error("DB no disponible al iniciar. El servidor queda arriba en modo degradado.");
      console.error(error);
      startDatabaseRetryLoop({ alter: SHOULD_ALTER_SCHEMA, retryMs: 15000 });
    }

    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error crítico al iniciar:", error);
    console.error("Mensaje:", error?.message || "(sin mensaje)");
    console.error("Nombre:", error?.name || "(sin nombre)");
    if (error?.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();

export default app;
