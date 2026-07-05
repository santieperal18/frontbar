import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Restaurante from "./restaurante.js";

class Usuario extends Model {}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id"
    },
    usuario: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "usuario"
    },
    contrasena: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "contrasena"
    },
    roles: {
      type: DataTypes.TEXT,
      defaultValue: "owner",
      field: "roles"
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
    modelName: "Usuario",
    tableName: "usuario",
    timestamps: false
  }
);

Usuario.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

Restaurante.hasMany(Usuario, {
  foreignKey: "restauranteId",
  as: "usuarios"
});

export default Usuario;
