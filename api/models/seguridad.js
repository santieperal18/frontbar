import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";
import Usuario from "./usuario.js";
import Restaurante from "./restaurante.js";

class Rol extends Model {}
class Permiso extends Model {}
class RolPermiso extends Model {}
class UsuarioRol extends Model {}
class SesionUsuario extends Model {}
class TokenAcceso extends Model {}
class HistorialAcceso extends Model {}

Rol.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restauranteId: { type: DataTypes.INTEGER, allowNull: false, field: "restaurante_id" },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
  clave: { type: DataTypes.STRING(60), allowNull: false },
  esSistema: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "es_sistema" }
}, { sequelize, modelName: "Rol", tableName: "rol", timestamps: true, indexes: [{ unique: true, fields: ["restaurante_id", "clave"] }] });

Permiso.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clave: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  modulo: { type: DataTypes.STRING(40), allowNull: false }
}, { sequelize, modelName: "Permiso", tableName: "permiso", timestamps: false });

RolPermiso.init({
  rolId: { type: DataTypes.INTEGER, primaryKey: true, field: "rol_id" },
  permisoId: { type: DataTypes.INTEGER, primaryKey: true, field: "permiso_id" }
}, { sequelize, modelName: "RolPermiso", tableName: "rol_permiso", timestamps: false });

UsuarioRol.init({
  usuarioId: { type: DataTypes.INTEGER, primaryKey: true, field: "usuario_id" },
  rolId: { type: DataTypes.INTEGER, primaryKey: true, field: "rol_id" }
}, { sequelize, modelName: "UsuarioRol", tableName: "usuario_rol", timestamps: false });

SesionUsuario.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  usuarioId: { type: DataTypes.INTEGER, allowNull: false, field: "usuario_id" },
  tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true, field: "token_hash" },
  dispositivo: { type: DataTypes.STRING(255), allowNull: true },
  ip: { type: DataTypes.STRING(64), allowNull: true },
  ultimoAccesoEn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "ultimo_acceso_en" },
  expiraEn: { type: DataTypes.DATE, allowNull: false, field: "expira_en" },
  revocadaEn: { type: DataTypes.DATE, allowNull: true, field: "revocada_en" }
}, { sequelize, modelName: "SesionUsuario", tableName: "sesion_usuario", timestamps: true });

TokenAcceso.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  usuarioId: { type: DataTypes.INTEGER, allowNull: true, field: "usuario_id" },
  restauranteId: { type: DataTypes.INTEGER, allowNull: true, field: "restaurante_id" },
  tipo: { type: DataTypes.ENUM("invitacion", "verificacion_email", "recuperacion_contrasena"), allowNull: false },
  tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true, field: "token_hash" },
  datos: { type: DataTypes.TEXT, allowNull: true },
  expiraEn: { type: DataTypes.DATE, allowNull: false, field: "expira_en" },
  usadoEn: { type: DataTypes.DATE, allowNull: true, field: "usado_en" }
}, { sequelize, modelName: "TokenAcceso", tableName: "token_acceso", timestamps: true });

HistorialAcceso.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuarioId: { type: DataTypes.INTEGER, allowNull: true, field: "usuario_id" },
  restauranteId: { type: DataTypes.INTEGER, allowNull: true, field: "restaurante_id" },
  evento: { type: DataTypes.STRING(60), allowNull: false },
  ip: { type: DataTypes.STRING(64), allowNull: true },
  dispositivo: { type: DataTypes.STRING(255), allowNull: true },
  detalle: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, modelName: "HistorialAcceso", tableName: "historial_acceso", timestamps: true, updatedAt: false });

Rol.belongsToMany(Permiso, { through: RolPermiso, foreignKey: "rolId", as: "permisos" });
Permiso.belongsToMany(Rol, { through: RolPermiso, foreignKey: "permisoId", as: "roles" });
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: "usuarioId", as: "rolesAsignados" });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: "rolId", as: "usuarios" });
Rol.belongsTo(Restaurante, { foreignKey: "restauranteId", as: "restaurante" });
Restaurante.hasMany(Rol, { foreignKey: "restauranteId", as: "roles" });
SesionUsuario.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
Usuario.hasMany(SesionUsuario, { foreignKey: "usuarioId", as: "sesiones" });

export { Rol, Permiso, RolPermiso, UsuarioRol, SesionUsuario, TokenAcceso, HistorialAcceso };
