export default class RepositorioBase {
  constructor(modelo) {
    this.modelo = modelo;
  }

  scope(restauranteId, where = {}) {
    if (!restauranteId || !this.modelo.rawAttributes?.restauranteId) {
      return where;
    }
    return { ...where, restauranteId };
  }

  async obtenerTodos({ pagina = 1, limite = 10 } = {}, restauranteId) {
    const offset = (pagina - 1) * limite;
    return this.modelo.findAll({
      where: this.scope(restauranteId),
      limit: limite,
      offset
    });
  }

  async obtenerPorId(id, restauranteId, opciones = {}) {
    return this.modelo.findOne({
      where: this.scope(restauranteId, { id }),
      ...opciones
    });
  }

  async crear(datos, restauranteId, opciones = {}) {
    const payload = this.modelo.rawAttributes?.restauranteId && restauranteId
      ? { restauranteId, ...datos }
      : datos;
    return this.modelo.create(payload, opciones);
  }

  async actualizar(id, datos, restauranteId, opciones = {}) {
    const instancia = await this.obtenerPorId(id, restauranteId, opciones);
    if (!instancia) {
      throw new Error(`Error: Instancia con id: ${id} no encontrada`);
    }
    return instancia.update(datos, opciones);
  }

  async eliminar(id, restauranteId, opciones = {}) {
    const instancia = await this.obtenerPorId(id, restauranteId, opciones);
    if (!instancia) {
      throw new Error(`Error: Instancia con id: ${id} no encontrada`);
    }
    await instancia.destroy(opciones);
    return instancia;
  }

  async contarTodos(restauranteId) {
    return this.modelo.count({ where: this.scope(restauranteId) });
  }

  async buscar(condiciones, opciones = {}, restauranteId) {
    return this.modelo.findAll({
      where: this.scope(restauranteId, condiciones),
      ...opciones
    });
  }
}
