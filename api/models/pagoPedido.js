import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class PagoPedido extends Model {}

PagoPedido.init(
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
    idPedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_pedido"
    },
    idTurnoCaja: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "id_turno_caja"
    },
    metodoPago: {
      type: DataTypes.ENUM("efectivo", "tarjeta", "transferencia"),
      allowNull: false,
      field: "metodo_pago"
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "monto"
    }
  },
  {
    sequelize,
    modelName: "PagoPedido",
    tableName: "pago_pedido",
    timestamps: false
  }
);

export default PagoPedido;
