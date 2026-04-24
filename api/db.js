import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Detectar si estamos en Railway o en ambiente local
const isRailway = !!process.env.RAILWAY_ENVIRONMENT_NAME;
const isProduction = process.env.NODE_ENV === "production" || isRailway;

let sequelize;

if (process.env.DATABASE_URL) {
  // Railway proporciona DATABASE_URL - usar eso (conexión privada, más rápida)
  console.log('📡 Usando DATABASE_URL de Railway (conexión privada)');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: isProduction ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else if (process.env.DB_DIALECT === "postgres" || (isProduction && process.env.PGHOST)) {
  // Configuración manual de PostgreSQL o variables de Railway
  console.log('📡 Usando PostgreSQL con variables de entorno');
  sequelize = new Sequelize(
    process.env.DB_NAME || process.env.PGDATABASE || "resto_bar_db",
    process.env.DB_USER || process.env.PGUSER || "postgres",
    process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    {
      host: process.env.DB_HOST || process.env.PGHOST || "localhost",
      port: process.env.DB_PORT || process.env.PGPORT || 5432,
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: isProduction ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    }
  );
} else if (isProduction) {
  // En producción, NUNCA usar SQLite
  throw new Error(
    "❌ ERROR: No se encontró configuración de PostgreSQL para producción.\n" +
    "Configura DATABASE_URL o las variables: DB_DIALECT, DB_HOST, DB_USER, DB_PASSWORD"
  );
} else {
  // Desarrollo local con SQLite
  console.log('💾 Usando SQLite (desarrollo local)');
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./data/restoBar.db",
    logging: false
  });
}

export default sequelize;
