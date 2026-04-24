import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

let sequelize;

// Railway automáticamente proporciona DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('✅ Conectando a PostgreSQL via DATABASE_URL (Railway)');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
}
// Fallback: Usar configuración manual si existe
else if (process.env.DB_DIALECT === "postgres") {
  console.log('✅ Conectando a PostgreSQL via variables DB_*');
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
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
  });
}
// Desarrollo local
else {
  console.log('✅ Conectando a SQLite (desarrollo local)');
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./data/restoBar.db",
    logging: false
  });
}

export default sequelize;
