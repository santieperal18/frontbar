import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasRailwayPgVars = Boolean(
  process.env.PGHOST &&
  process.env.PGDATABASE &&
  process.env.PGUSER
);
const hasLegacyPgVars = Boolean(
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_USER
);

const usePostgres = process.env.DB_DIALECT === "postgres" || hasDatabaseUrl || hasRailwayPgVars || hasLegacyPgVars;

const commonOptions = {
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sslOption = process.env.DB_SSL === "false"
  ? false
  : {
      require: true,
      rejectUnauthorized: false
    };

function buildPostgresSequelize() {
  if (hasDatabaseUrl) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: { ssl: sslOption },
      ...commonOptions
    });
  }

  if (hasRailwayPgVars) {
    return new Sequelize(
      process.env.PGDATABASE,
      process.env.PGUSER,
      process.env.PGPASSWORD || "",
      {
        host: process.env.PGHOST,
        port: process.env.PGPORT || 5432,
        dialect: "postgres",
        dialectOptions: { ssl: sslOption },
        ...commonOptions
      }
    );
  }

  if (hasLegacyPgVars) {
    return new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        dialectOptions: { ssl: sslOption },
        ...commonOptions
      }
    );
  }

  if (nodeEnv === "production") {
    throw new Error(
      "No se encontraron credenciales PostgreSQL para produccion. Configura DATABASE_URL o las variables PGHOST/PGDATABASE/PGUSER/PGPASSWORD."
    );
  }

  return new Sequelize({
    dialect: "sqlite",
    storage: "./data/restoBar.db",
    logging: false
  });
}

const sequelize = usePostgres ? buildPostgresSequelize() : new Sequelize({
  dialect: "sqlite",
  storage: "./data/restoBar.db",
  logging: false
});

export const dbState = {
  ready: false,
  connecting: false,
  attempts: 0,
  lastError: null,
  lastConnectedAt: null
};

function formatDbError(error) {
  return {
    name: error?.name || "UnknownError",
    message: error?.message || String(error),
    code: error?.original?.code || error?.parent?.code || error?.code || null
  };
}

export async function initializeDatabase({ alter = true } = {}) {
  if (dbState.connecting) {
    return false;
  }

  dbState.connecting = true;
  dbState.attempts += 1;

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter });
    dbState.ready = true;
    dbState.lastError = null;
    dbState.lastConnectedAt = new Date().toISOString();
    return true;
  } catch (error) {
    dbState.ready = false;
    dbState.lastError = formatDbError(error);
    throw error;
  } finally {
    dbState.connecting = false;
  }
}

export function startDatabaseRetryLoop({ alter = true, retryMs = 15000 } = {}) {
  const tick = async () => {
    if (dbState.ready || dbState.connecting) {
      return;
    }

    try {
      await initializeDatabase({ alter });
      console.log("Base de datos conectada y sincronizada");
    } catch (error) {
      const info = formatDbError(error);
      console.error(`Reintento DB fallido: ${info.name} ${info.code || ""} ${info.message}`);
    }
  };

  void tick();
  return setInterval(tick, retryMs);
}

export function ensureDatabaseReady(req, res, next) {
  if (dbState.ready) {
    return next();
  }

  return res.status(503).json({
    error: "Base de datos no disponible temporalmente",
    db: dbState
  });
}

export default sequelize;
