import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

let sequelize;

// Prioridad 1: DATABASE_URL (Railway lo proporciona automáticamente)
if (process.env.DATABASE_URL) {
  console.log('📡 Usando DATABASE_URL de Railway');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}
// Prioridad 2: Variables de Railway (PGHOST, PGUSER, etc.)
else if (process.env.PGHOST && process.env.PGUSER) {
  console.log('📡 Usando variables de Railway (PGHOST, PGUSER, etc.)');
  sequelize = new Sequelize(
    process.env.PGDATABASE || "railway",
    process.env.PGUSER,
    process.env.POSTGRES_PASSWORD,
    {
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  );
}
// Prioridad 3: Configuración manual de PostgreSQL (DB_DIALECT, DB_HOST, etc.)
else if (process.env.DB_DIALECT === "postgres") {
  console.log('📡 Usando PostgreSQL con variables DB_*');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  );
}
// Fallback: SQLite para desarrollo local
else {
  console.log('💾 Usando SQLite (desarrollo local)');
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./data/restoBar.db",
    logging: false
  });
}

export default sequelize;
