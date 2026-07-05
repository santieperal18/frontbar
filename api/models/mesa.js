import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class Mesa extends Model {}

Mesa.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id"
    },
    restauranteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "restaurante_id"
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "numero"
    },
    estado: {
      type: DataTypes.ENUM("libre", "ocupada", "pidiendo_cuenta"),
      allowNull: false,
      defaultValue: "libre",
      field: "estado"
    }
  },
  {
    sequelize,
    modelName: "Mesa",
    tableName: "mesa",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["restaurante_id", "numero"] }
    ]
  }
);

export default Mesa;
