import express from 'express';
import sequelize from './db.js';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Importar rutas
import clientesRouter from './routes/clientes.routes.js';
import productosRouter from './routes/productos.routes.js';
import pedidosRouter from './routes/pedidos.routes.js';
import repartidoresRouter from './routes/repartidores.routes.js';
import categoriasRouter from './routes/categorias.routes.js';
import reportesRouter from './routes/reportes.routes.js';
import authRouter from './routes/auth.routes.js';

// Importar middlewares
import { verificarToken, registrarAcceso } from './middleware/autenticacion.js';
import usuarioService from './services/usuarioService.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// SEGURIDAD - HELMET
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// ============================================
// CORS - CONFIGURACIÓN SEGURA
// ============================================
app.use(cors({
  origin: [
    'http://localhost:5173', // Tu entorno local de desarrollo
    'https://bar-production-84b0.up.railway.app' // Tu Frontend en producción
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true // Muy importante si estás usando JWT/Tokens
}));

// ============================================
// RATE LIMITING - PROTECCIÓN CONTRA ATAQUES
// ============================================
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: 5,
  message: { error: "Demasiados intentos. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development',
  keyGenerator: (req) => req.ip || req.connection.remoteAddress
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: { error: "Límite de solicitudes excedido" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development'
});

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(registrarAcceso);
app.use('/api/', apiLimiter);

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Resto Bar API - Segura</title>
        <style>
          body { 
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
            font-family: 'Arial', sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            color: white;
            margin: 0;
          }
          .container { 
            background: rgba(255, 255, 255, 0.1); 
            backdrop-filter: blur(10px);
            padding: 2rem; 
            border-radius: 12px; 
            box-shadow: 0 0 20px rgba(0,0,0,0.3); 
            text-align: center; 
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 600px;
          }
          h1 { margin-top: 0; font-size: 2rem; }
          .status { 
            padding: 0.5rem 1rem;
            background: rgba(76, 175, 80, 0.3);
            border-left: 4px solid #4CAF50;
            margin: 1rem 0;
            border-radius: 4px;
          }
          .endpoints { 
            text-align: left; 
            margin-top: 1.5rem;
            background: rgba(0,0,0,0.2);
            padding: 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
          }
          .endpoint { 
            padding: 0.4rem; 
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-family: monospace;
          }
          .endpoint:last-child { border-bottom: none; }
          .auth { color: #81C784; }
          .info { font-size: 0.85rem; color: #B3E5FC; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🍽️ Resto Bar API</h1>
          <div class="status">✅ Servidor Seguro en Línea</div>
          <p><strong>Ambiente:</strong> ${NODE_ENV}</p>
          <p><strong>Puerto:</strong> ${PORT}</p>
          
          <div class="endpoints">
            <strong>Autenticación:</strong>
            <div class="endpoint auth">POST /api/auth/login</div>
            <div class="endpoint auth">POST /api/auth/refresh</div>
            <div class="endpoint auth">POST /api/auth/logout</div>
            
            <strong style="margin-top: 1rem; display: block;">API (Requieren Token):</strong>
            <div class="endpoint">GET /api/clientes</div>
            <div class="endpoint">GET /api/productos</div>
            <div class="endpoint">GET /api/pedidos</div>
            <div class="endpoint">GET /api/repartidores</div>
            <div class="endpoint">GET /api/categorias</div>
            <div class="endpoint">GET /api/reportes</div>
          </div>
          
          <div class="info">
            🔒 Seguridad: Helmet, Rate Limiting, JWT, CORS, Validación
          </div>
        </div>
      </body>
    </html>
  `);
});

// ============================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRouter);

// ============================================
// RUTAS PROTEGIDAS (Requieren token JWT)
// ============================================
app.use("/api/clientes", verificarToken, clientesRouter);
app.use("/api/productos", verificarToken, productosRouter);
app.use("/api/pedidos", verificarToken, pedidosRouter);
app.use("/api/repartidores", verificarToken, repartidoresRouter);
app.use("/api/categorias", verificarToken, categoriasRouter);
app.use("/api/reportes", verificarToken, reportesRouter);

// ============================================
// MANEJO DE ERRORES
// ============================================
// Error 404
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method
  });
});

// Error 500
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  const statusCode = err.statusCode || 500;
  const mensaje = NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(statusCode).json({ 
    error: mensaje,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
(async function start() {
  try {
    // Validar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Sincronizar modelos
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados con la base de datos');

    // Crear usuario administrador si no existe
    await usuarioService.crearUsuarioOwner();
    console.log('✅ Usuario administrador verificado');

    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚀 Servidor Seguro iniciado`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔒 Ambiente: ${NODE_ENV}`);
      console.log(`${'='.repeat(50)}\n`);
    });

    // Manejo de errores del servidor
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} ya está en uso`);
      } else {
        console.error('❌ Error del servidor:', err);
      }
      process.exit(1);
    });

    // Manejo de señales de terminación
    process.on('SIGTERM', () => {
      console.log('📋 Señal SIGTERM recibida. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        sequelize.close().then(() => {
          console.log('✅ Conexión a BD cerrada');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Error crítico al iniciar:', error.message);
    process.exit(1);
  }
})();

export default app;
