import { Permiso, Rol, UsuarioRol } from "../models/seguridad.js";

export const PERMISOS = [
  ["ventas.ver", "Ver ventas", "ventas"], ["pedidos.crear", "Crear pedidos", "pedidos"],
  ["pedidos.editar", "Editar pedidos", "pedidos"], ["pedidos.cancelar", "Cancelar pedidos", "pedidos"],
  ["caja.cobrar", "Cobrar", "caja"], ["caja.abrir", "Abrir caja", "caja"], ["caja.cerrar", "Cerrar caja", "caja"],
  ["reportes.ver", "Ver reportes", "reportes"], ["productos.editar", "Editar productos", "productos"],
  ["precios.editar", "Editar precios", "productos"], ["costos.ver", "Ver costos", "productos"],
  ["usuarios.gestionar", "Gestionar usuarios", "usuarios"], ["datos.exportar", "Exportar datos", "reportes"],
  ["cocina.ver", "Ver cocina", "cocina"], ["repartos.ver", "Ver repartos", "repartos"], ["clientes.gestionar", "Gestionar clientes", "clientes"]
];

const ROLES = {
  owner: ["*"], administrador: ["*"], encargado: ["ventas.ver", "pedidos.crear", "pedidos.editar", "pedidos.cancelar", "caja.cobrar", "caja.abrir", "caja.cerrar", "reportes.ver", "productos.editar", "precios.editar", "cocina.ver", "repartos.ver", "clientes.gestionar"],
  cajero: ["ventas.ver", "pedidos.crear", "pedidos.editar", "caja.cobrar", "caja.abrir", "caja.cerrar"], mozo: ["pedidos.crear", "pedidos.editar"], cocina: ["cocina.ver"], repartidor: ["repartos.ver"], contador: ["ventas.ver", "reportes.ver", "costos.ver", "datos.exportar"], soporte_interno: ["usuarios.gestionar"]
};

class AutorizacionService {
  async asegurarCatalogo(restauranteId) {
    for (const [clave, nombre, modulo] of PERMISOS) await Permiso.findOrCreate({ where: { clave }, defaults: { clave, nombre, modulo } });
    const permisos = await Permiso.findAll();
    for (const [clave, permitidos] of Object.entries(ROLES)) {
      const [rol] = await Rol.findOrCreate({ where: { restauranteId, clave }, defaults: { restauranteId, clave, nombre: clave.replaceAll("_", " "), esSistema: true } });
      if (permitidos.includes("*")) await rol.setPermisos(permisos);
      else await rol.setPermisos(permisos.filter((permiso) => permitidos.includes(permiso.clave)));
    }
  }

  async asignarRol(usuarioId, restauranteId, clave) {
    await this.asegurarCatalogo(restauranteId);
    const rol = await Rol.findOne({ where: { restauranteId, clave } });
    if (!rol) throw new Error("Rol no encontrado");
    await UsuarioRol.destroy({ where: { usuarioId } });
    await UsuarioRol.create({ usuarioId, rolId: rol.id });
    return rol;
  }

  async obtenerContexto(usuario) {
    await this.asegurarCatalogo(usuario.restauranteId);
    const roles = await usuario.getRolesAsignados({ include: [{ model: Permiso, as: "permisos", through: { attributes: [] } }] });
    const clavesRoles = roles.length ? roles.map((rol) => rol.clave) : [usuario.roles || "owner"];
    const permisos = [...new Set(roles.flatMap((rol) => rol.permisos.map((permiso) => permiso.clave)))];
    if (clavesRoles.some((rol) => ["owner", "administrador"].includes(rol))) permisos.push("*");
    return { roles: clavesRoles, permisos: [...new Set(permisos)] };
  }
}

export default new AutorizacionService();
