import RepositorioBase from "./repositorioBase.js";
import PagoPedido from "../models/pagoPedido.js";

class PagoPedidoRepository extends RepositorioBase {
  constructor() {
    super(PagoPedido);
  }
}

export default new PagoPedidoRepository();
