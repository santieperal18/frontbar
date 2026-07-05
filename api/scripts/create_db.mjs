import sequelize, { initializeDatabase } from "../db.js";

// Importar modelos para registrar asociaciones.
import "../models/restaurante.js";
import "../models/categoria.js";
import "../models/producto.js";
import "../models/cliente.js";
import "../models/repartidor.js";
import "../models/mesa.js";
import "../models/pedido.js";
import "../models/pedidoProducto.js";
import "../models/turnoCaja.js";
import "../models/pagoPedido.js";
import "../models/usuario.js";

(async () => {
  try {
    console.log(`Sincronizando modelos con dialecto ${sequelize.getDialect()}...`);
    await initializeDatabase({ alter: process.env.DB_SYNC_ALTER === "true" });
    console.log("Sincronizacion completada.");
    process.exit(0);
  } catch (err) {
    console.error("Error al sincronizar la base de datos:", err);
    process.exit(1);
  }
})();
