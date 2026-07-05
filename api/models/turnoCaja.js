import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class TurnoCaja extends Model {}

TurnoCaja.init(
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
    fechaApertura: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "fecha_apertura"
    },
    fechaCierre: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_cierre"
    },
    montoApertura: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: "monto_apertura"
    },
    estado: {
      type: DataTypes.ENUM("abierto", "cerrado"),
      allowNull: false,
      defaultValue: "abierto",
      field: "estado"
    }
  },
  {
    sequelize,
    modelName: "TurnoCaja",
    tableName: "turno_caja",
    timestamps: false
  }
);

export default TurnoCaja;
