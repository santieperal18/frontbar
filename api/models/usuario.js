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
    email: {
      type: DataTypes.STRING(254),
      allowNull: true,
      unique: true,
      field: "email"
    },
    nombre: { type: DataTypes.STRING(120), allowNull: true, field: "nombre" },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "activo" },
    emailVerificadoEn: { type: DataTypes.DATE, allowNull: true, field: "email_verificado_en" },
    intentosFallidos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "intentos_fallidos" },
    bloqueadoHasta: { type: DataTypes.DATE, allowNull: true, field: "bloqueado_hasta" },
    mfaSecreto: { type: DataTypes.STRING(128), allowNull: true, field: "mfa_secreto" },
    mfaHabilitado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "mfa_habilitado" },
    contrasenaCambiadaEn: { type: DataTypes.DATE, allowNull: true, field: "contrasena_cambiada_en" },
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
