import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Restaurante from "./restaurante.js";

class MetodoPago extends Model {}
class Impresora extends Model {}

MetodoPago.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restauranteId: { type: DataTypes.INTEGER, allowNull: false, field: "restaurante_id" },
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  tipo: { type: DataTypes.ENUM("efectivo", "tarjeta", "transferencia", "billetera", "otro"), allowNull: false, defaultValue: "efectivo" },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  requiereReferencia: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "requiere_referencia" }
}, { sequelize, modelName: "MetodoPago", tableName: "metodo_pago", timestamps: true, indexes: [{ unique: true, fields: ["restaurante_id", "nombre"] }] });

Impresora.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restauranteId: { type: DataTypes.INTEGER, allowNull: false, field: "restaurante_id" },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  destino: { type: DataTypes.ENUM("cocina", "caja", "barra"), allowNull: false, defaultValue: "cocina" },
  tipoConexion: { type: DataTypes.ENUM("red", "usb", "sistema"), allowNull: false, defaultValue: "red", field: "tipo_conexion" },
  direccion: { type: DataTypes.STRING(255), allowNull: true },
  activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { sequelize, modelName: "Impresora", tableName: "impresora", timestamps: true });

MetodoPago.belongsTo(Restaurante, { foreignKey: "restauranteId", as: "restaurante" });
Impresora.belongsTo(Restaurante, { foreignKey: "restauranteId", as: "restaurante" });
Restaurante.hasMany(MetodoPago, { foreignKey: "restauranteId", as: "metodosPago" });
Restaurante.hasMany(Impresora, { foreignKey: "restauranteId", as: "impresoras" });

export { MetodoPago, Impresora };
