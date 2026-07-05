import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Cliente from "./cliente.js";
import Repartidor from "./repartidor.js";
import Restaurante from "./restaurante.js";
import Mesa from "./mesa.js";

class Pedido extends Model {}

Pedido.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "id"
    },
    idCliente: {
      type: DataTypes.INTEGER,
      field: "id_cliente"
    },
    idRepartidor: {
      type: DataTypes.INTEGER,
      field: "id_repartidor"
    },
    idMesa: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "id_mesa"
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "fecha"
    },
    tipoEntrega: {
      type: DataTypes.ENUM("local", "delivery", "salon", "mostrador"),
      defaultValue: "mostrador",
      field: "tipo_entrega"
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "preparando", "listo", "en_camino", "entregado", "cancelado", "cobrado"),
      defaultValue: "pendiente",
      field: "estado"
    },
    estadoPago: {
      type: DataTypes.ENUM("pendiente", "pidiendo_cuenta", "pagado"),
      defaultValue: "pendiente",
      field: "estado_pago"
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: "total"
    },
    direccionEntrega: {
      type: DataTypes.TEXT,
      field: "direccion_entrega"
    },
    observaciones: {
      type: DataTypes.TEXT,
      field: "observaciones"
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
    modelName: "Pedido",
    tableName: "pedido",
    timestamps: false
  }
);

Pedido.belongsTo(Cliente, {
  foreignKey: "idCliente",
  as: "cliente"
});

Pedido.belongsTo(Repartidor, {
  foreignKey: "idRepartidor",
  as: "repartidor"
});

Pedido.belongsTo(Mesa, {
  foreignKey: "idMesa",
  as: "mesa"
});

Pedido.belongsTo(Restaurante, {
  foreignKey: "restauranteId",
  as: "restaurante"
});

Cliente.hasMany(Pedido, {
  foreignKey: "idCliente",
  as: "pedidos"
});

Repartidor.hasMany(Pedido, {
  foreignKey: "idRepartidor",
  as: "pedidos"
});

Mesa.hasMany(Pedido, {
  foreignKey: "idMesa",
  as: "pedidos"
});

export default Pedido;
