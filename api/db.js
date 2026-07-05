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
const isRailwayInternalHost = (host) => typeof host === "string" && host.includes("railway.internal");

const commonOptions = {
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {},
  retry: {
    max: 2
  }
};

function buildSslOption(host) {
  if (process.env.DB_SSL === "false") {
    return false;
  }

  if (process.env.DB_SSL === "true") {
    return {
      require: true,
      rejectUnauthorized: false
    };
  }

  if (isRailwayInternalHost(host)) {
    return false;
  }

  return {
    require: true,
    rejectUnauthorized: false
  };
}

function createSequelizeFromParams({ database, username, password, host, port, source }) {
  const ssl = buildSslOption(host);
  const sequelize = new Sequelize(database, username, password, {
    host,
    port: port || 5432,
    dialect: "postgres",
    dialectOptions: {
      ...(ssl ? { ssl } : {}),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || "10000", 10)
    },
    ...commonOptions
  });

  sequelize.__connectionSource = source;
  sequelize.__connectionHost = host;
  return sequelize;
}

function createSequelizeFromUrl(url, source) {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  })();

  const ssl = buildSslOption(host);
  const sequelize = new Sequelize(url, {
    dialect: "postgres",
    dialectOptions: {
      ...(ssl ? { ssl } : {}),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || "10000", 10)
    },
    ...commonOptions
  });

  sequelize.__connectionSource = source;
  sequelize.__connectionHost = host;
  return sequelize;
}

function buildPostgresSequelize() {
  // En Railway conviene priorizar la red privada PGHOST/PGPORT por sobre DATABASE_URL
  // porque evita pasar por endpoints públicos/proxy.
  if (hasRailwayPgVars) {
    return createSequelizeFromParams({
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD || "",
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      source: "railway-pg-vars"
    });
  }

  if (hasLegacyPgVars) {
    return createSequelizeFromParams({
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      source: "legacy-db-vars"
    });
  }

  if (hasDatabaseUrl) {
    return createSequelizeFromUrl(process.env.DATABASE_URL, "database-url");
  }

  if (nodeEnv === "production") {
    throw new Error(
      "No se encontraron credenciales PostgreSQL para produccion. Configura PGHOST/PGDATABASE/PGUSER/PGPASSWORD o DATABASE_URL."
    );
  }

  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./data/restoBar.db",
    logging: false
  });
  sequelize.__connectionSource = "sqlite-dev";
  sequelize.__connectionHost = "local-file";
  return sequelize;
}

const sequelize = usePostgres ? buildPostgresSequelize() : new Sequelize({
  dialect: "sqlite",
  storage: "./data/restoBar.db",
  logging: false
});

if (!sequelize.__connectionSource) {
  sequelize.__connectionSource = "sqlite-fallback";
  sequelize.__connectionHost = "local-file";
}

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
