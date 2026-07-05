import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Restaurante from "./restaurante.js";

class Repartidor extends Model {}

Repartidor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id"
    },
    nombre: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "nombre"
    },
    apellido: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "apellido"
    },
    telefono: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "telefono"
    },
    vehiculo: {
      type: DataTypes.TEXT,
      field: "vehiculo"
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "activo"
    },
    restauranteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "restaurante_id"
    }
  },
  {
    sequelize,
    modelName: "Repartidor",
    tableName: "repartidor",
    timestamps: false
  }
);

Repartidor.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

export default Repartidor;
