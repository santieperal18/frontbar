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

export default sequelize;
