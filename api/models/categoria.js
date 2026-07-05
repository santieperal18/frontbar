import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Restaurante from "./restaurante.js";

class Categoria extends Model {}

Categoria.init(
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
    tipo: {
      type: DataTypes.ENUM("desayuno", "comida", "bebida"),
      allowNull: false,
      field: "tipo"
    },
    descripcion: {
      type: DataTypes.TEXT,
      field: "descripcion"
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
    modelName: "Categoria",
    tableName: "categoria",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["restaurante_id", "nombre"] }
    ]
  }
);

Categoria.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

export default Categoria;
