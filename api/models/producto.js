import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Categoria from "./categoria.js";
import Restaurante from "./restaurante.js";

class Producto extends Model {}

Producto.init(
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
    descripcion: {
      type: DataTypes.TEXT,
      field: "descripcion"
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "precio"
    },
    precioSalon: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "precio_salon"
    },
    precioMostrador: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "precio_mostrador"
    },
    costo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "costo"
    },
    idCategoria: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_categoria"
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "disponible"
    },
    imagen: {
      type: DataTypes.TEXT,
      field: "imagen"
    },
    controlaStock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "controla_stock"
    },
    stockActual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "stock_actual"
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
    modelName: "Producto",
    tableName: "producto",
    timestamps: false
  }
);

Producto.belongsTo(Categoria, {
  foreignKey: "idCategoria",
  as: "categoria"
});

Categoria.hasMany(Producto, {
  foreignKey: "idCategoria",
  as: "productos"
});

Producto.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

export default Producto;
