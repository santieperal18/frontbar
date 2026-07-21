import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

class Restaurante extends Model {}

Restaurante.init(
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
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: "slug"
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "activo"
    },
    moneda: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "ARS", field: "moneda" },
    pais: { type: DataTypes.STRING(2), allowNull: false, defaultValue: "AR", field: "pais" },
    zonaHoraria: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "America/Argentina/Buenos_Aires", field: "zona_horaria" },
    porcentajeImpuesto: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: "porcentaje_impuesto" },
    razonSocial: { type: DataTypes.STRING(160), allowNull: true, field: "razon_social" },
    identificacionFiscal: { type: DataTypes.STRING(32), allowNull: true, field: "identificacion_fiscal" },
    direccion: { type: DataTypes.STRING(255), allowNull: true, field: "direccion" },
    telefono: { type: DataTypes.STRING(60), allowNull: true, field: "telefono" },
    emailComercial: { type: DataTypes.STRING(254), allowNull: true, field: "email_comercial" },
    logoUrl: { type: DataTypes.TEXT, allowNull: true, field: "logo_url" },
    onboardingCompletado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "onboarding_completado" },
    onboardingPaso: { type: DataTypes.STRING(40), allowNull: true, field: "onboarding_paso" }
  },
  {
    sequelize,
    modelName: "Restaurante",
    tableName: "restaurante",
    timestamps: false
  }
);

export default Restaurante;
