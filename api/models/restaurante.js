import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class Restaurante extends Model {}

Restaurante.init(
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
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "slug"
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "activo"
    }
  },
  {
    sequelize,
    modelName: "Restaurante",
    tableName: "restaurante",
    timestamps: false
  }
);

export default Restaurante;
