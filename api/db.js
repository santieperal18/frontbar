import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const usePostgres = process.env.DB_DIALECT === "postgres" || hasDatabaseUrl;

const commonOptions = {
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = usePostgres
  ? (hasDatabaseUrl
      ? new Sequelize(process.env.DATABASE_URL, {
          dialect: "postgres",
          dialectOptions: {
            ssl: process.env.DB_SSL === "false"
              ? false
              : {
                  require: true,
                  rejectUnauthorized: false
                }
          },
          ...commonOptions
        })
      : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 5432,
          dialect: "postgres",
          dialectOptions: {
            ssl: process.env.DB_SSL === "false"
              ? false
              : {
                  require: true,
                  rejectUnauthorized: false
                }
          },
          ...commonOptions
        }))
  : new Sequelize({
      dialect: "sqlite",
      storage: "./data/restoBar.db",
      logging: false
    });

export default sequelize;
