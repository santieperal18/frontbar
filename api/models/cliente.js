import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Restaurante from "./restaurante.js";

class Cliente extends Model {}

Cliente.init(
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
      field: "telefono"
    },
    direccion: {
      type: DataTypes.TEXT,
      field: "direccion"
    },
    email: {
      type: DataTypes.TEXT,
      validate: {
        isEmail: true
      },
      field: "email"
    },
    fechaRegistro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "fecha_registro"
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
    modelName: "Cliente",
    tableName: "cliente",
    timestamps: false
  }
);

Cliente.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

export default Cliente;
