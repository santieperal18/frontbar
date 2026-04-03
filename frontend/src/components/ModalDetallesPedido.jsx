import React from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const ModalDetallesPedido = ({ pedido, abierto, onCerrar, onEditar, onDuplicar }) => {
  if (!abierto || !pedido) return null;

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const calcularTotalProductos = () => {
    if (!pedido.productos) return 0;
    return pedido.productos.reduce((total, producto) => {
      const subtotal = producto.PedidoProducto?.subtotal || producto.precio;
      return total + parseFloat(subtotal);
    }, 0);
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'pendiente': return 'warning';
      case 'preparando': return 'info';
      case 'en_camino': return 'primary';
      case 'entregado': return 'success';
      case 'cancelado': return 'danger';
      default: return 'secondary';
    }
  };

  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'pendiente': return 'Pendiente';
      case 'preparando': return 'Preparando';
      case 'en_camino': return 'En Camino';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  return (
    <Modal
      isOpen={abierto}
      onRequestClose={onCerrar}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      className="modal-lg"
      overlayClassName="modal-backdrop-show"
    >
      <div className="modal-content">
        
        {/* Encabezado del modal */}
        <div className="modal-header bg-primary text-white">
          <h5 className="modal-title">
            <i className="fas fa-receipt me-2"></i>
            Detalles del Pedido #{pedido.id}
          </h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={onCerrar}
            aria-label="Cerrar"
          ></button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="modal-body">
          <div className="row mb-4">
            
            {/* Información del Pedido */}
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-header bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    Información del Pedido
                  </h6>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Fecha:</strong><br />
                    <span className="text-muted">{formatearFecha(pedido.fecha)}</span>
                  </p>
                  <p className="mb-2">
                    <strong>Tipo de Entrega:</strong><br />
                    <span className={`badge bg-${pedido.tipoEntrega === 'local' ? 'info' : 'warning'}`}>
                      {pedido.tipoEntrega === 'local' ? 'Consumo en Local' : 'Delivery'}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong>Estado:</strong><br />
                    <span className={`badge bg-${getEstadoColor(pedido.estado)}`}>
                      {getEstadoTexto(pedido.estado)}
                    </span>
                  </p>
                  <p className="mb-0">
                    <strong>Total:</strong><br />
                    <span className="h5 text-success">${pedido.total || calcularTotalProductos().toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Cliente/Repartidor */}
            <div className="col-md-6 mb-3">
              <div className="card h-100">
                <div className="card-header bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-users me-2"></i>
                    Información de Contacto
                  </h6>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>Cliente:</strong><br />
                    {pedido.cliente ? (
                      <span>{pedido.cliente.nombre} {pedido.cliente.apellido}</span>
                    ) : (
                      <span className="text-muted">N/A (No especificado)</span>
                    )}
                  </p>
                  
                  {pedido.tipoEntrega === 'delivery' && (
                    <>
                      <p className="mb-2">
                        <strong>Repartidor:</strong><br />
                        {pedido.repartidor ? (
                          <span>{pedido.repartidor.nombre} {pedido.repartidor.apellido}</span>
                        ) : (
                          <span className="text-warning">Pendiente de asignación</span>
                        )}
                      </p>
                      <p className="mb-0">
                        <strong>Dirección de Entrega:</strong><br />
                        <span className="text-muted">
                          {pedido.direccionEntrega || pedido.cliente?.direccion || 'No especificada'}
                        </span>
                      </p>
                    </>
                  )}
                  
                  {pedido.tipoEntrega === 'local' && (
                    <p className="mb-0 text-muted">
                      <i className="fas fa-store me-1"></i>
                      Consumo en local
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Productos */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">
                <i className="fas fa-shopping-cart me-2"></i>
                Productos del Pedido
              </h6>
            </div>
            <div className="card-body">
              {pedido.productos && pedido.productos.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">Precio Unit.</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.productos.map((producto, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{producto.nombre}</strong><br />
                            <small className="text-muted">{producto.descripcion}</small>
                          </td>
                          <td className="text-center">
                            {producto.PedidoProducto?.cantidad || 1}
                          </td>
                          <td className="text-end">
                            ${(producto.PedidoProducto?.precioUnitario || producto.precio).toFixed(2)}
                          </td>
                          <td className="text-end">
                            <strong>
                              ${(producto.PedidoProducto?.subtotal || producto.precio).toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end">
                          <strong>Total:</strong>
                        </td>
                        <td className="text-end">
                          <span className="h5 text-success">
                            ${pedido.total || calcularTotalProductos().toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-muted text-center">No hay productos en este pedido</p>
              )}
            </div>
          </div>

          {/* Observaciones */}
          {pedido.observaciones && (
            <div className="alert alert-warning">
              <h6 className="alert-heading">
                <i className="fas fa-sticky-note me-2"></i>
                Observaciones
              </h6>
              <p className="mb-0">{pedido.observaciones}</p>
            </div>
          )}
        </div>
        
        {/* Pie del modal */}
        <div className="modal-footer bg-light">
          <button 
            type="button" 
            className="btn btn-outline-secondary" 
            onClick={onCerrar}
          >
            <i className="fas fa-times me-2"></i>
            Cerrar
          </button>
          
          {pedido.estado !== 'cancelado' && pedido.estado !== 'entregado' && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => onEditar(pedido.id)}
            >
              <i className="fas fa-edit me-2"></i>
              Editar
            </button>
          )}
          
          <button 
            type="button" 
            className="btn btn-warning" 
            onClick={() => onDuplicar && onDuplicar(pedido.id)}
          >
            <i className="fas fa-copy me-2"></i>
            Duplicar
          </button>
          
          {pedido.idCliente && (
            <button 
              type="button" 
              className="btn btn-success"
              onClick={() => {
                // Aquí iría la lógica para generar reporte del cliente
                window.open(`/reportes/cliente/${pedido.idCliente}`, '_blank');
              }}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Generar Reporte
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ModalDetallesPedido;