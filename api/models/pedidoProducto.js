import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Pedido from "./pedido.js";
import Producto from "./producto.js";
import Restaurante from "./restaurante.js";

class PedidoProducto extends Model {}

PedidoProducto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id"
    },
    idPedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_pedido"
    },
    idProducto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_producto"
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "cantidad"
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "precio_unitario"
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "subtotal"
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
    modelName: "PedidoProducto",
    tableName: "pedido_producto",
    timestamps: false
  }
);

Pedido.belongsToMany(Producto, {
  through: PedidoProducto,
  foreignKey: "idPedido",
  otherKey: "idProducto",
  as: "productos"
});

Producto.belongsToMany(Pedido, {
  through: PedidoProducto,
  foreignKey: "idProducto",
  otherKey: "idPedido",
  as: "pedidos"
});

PedidoProducto.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

export default PedidoProducto;
