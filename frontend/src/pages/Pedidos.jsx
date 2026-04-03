import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pedidosService from "../services/pedidos.service";
import clientesService from "../services/clientes.service";
import ModalDetallesPedido from "../components/ModalDetallesPedido";

const Pedidos = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // OBTENER FECHA LOCAL CORRECTA (YYYY-MM-DD)
  // Esto evita que por diferencia horaria te ponga la fecha de ayer o mañana
  const obtenerFechaLocal = () => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hoy = obtenerFechaLocal();

  const ObtenerFechaMañana = () => {
    const ahora = new Date();
    ahora.setDate(ahora.getDate() + 1);
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const mañana = ObtenerFechaMañana();

  const [filtros, setFiltros] = useState({
    cliente: "",
    estado: "",
    tipoEntrega: "",
    fechaDesde: hoy,
    fechaHasta: mañana
  });
  
  const navigate = useNavigate();
  
  useEffect(() => { 
    cargarClientes();
    buscar(); 
  }, []);

  const cargarClientes = async () => {
    const data = await clientesService.obtenerTodos();
    setClientes(data);
  };

  const buscar = async () => {
    const params = {};
    if (filtros.cliente) params.cliente = filtros.cliente;
    if (filtros.estado) params.estado = filtros.estado;
    if (filtros.tipoEntrega) params.tipoEntrega = filtros.tipoEntrega;
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
    
    try {
        // Usamos buscarFiltrado para todo, así siempre respeta las fechas
        const data = await pedidosService.buscarFiltrado(params);
        setPedidos(data);
    } catch (error) {
        console.error("Error buscando:", error);
    }
  };

  const marcarEntregado = async (id) => {
    if(!window.confirm("¿Marcar entregado?")) return;
    try {
      await pedidosService.actualizarEstado(id, 'entregado');
      setPedidos(peds => peds.map(p => p.id === id ? {...p, estado: 'entregado'} : p));
    } catch(e) { alert("Error al actualizar"); }
  };

  const eliminarPedido = async (id) => {
    if(!window.confirm("¿Seguro de ELIMINAR este pedido?")) return;
    try {
      await pedidosService.eliminar(id);
      setPedidos(peds => peds.filter(p => p.id !== id));
    } catch (error) {
      alert("No se pudo eliminar.");
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Lista de Pedidos</h2>
        <button className="btn btn-primary" onClick={() => navigate("/pedidos/nuevo")}>+ Nuevo Pedido</button>
      </div>

      <div className="card mb-4 p-3 bg-light">
        <div className="row g-2">
           <div className="col-md-3">
             <select className="form-select" value={filtros.cliente} onChange={e => setFiltros({...filtros, cliente: e.target.value})}>
               <option value="">Todos los Clientes</option>
               {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
             </select>
           </div>
           <div className="col-md-2">
             <select className="form-select" value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}>
               <option value="">Todos los Estados</option>
               <option value="pendiente">Pendiente</option>
               <option value="preparando">Preparando</option>
               <option value="en_camino">En Camino</option>
               <option value="entregado">Entregado</option>
             </select>
           </div>
           <div className="col-md-2">
              <input type="date" className="form-control" value={filtros.fechaDesde} onChange={e => setFiltros({...filtros, fechaDesde: e.target.value})} />
           </div>
           <div className="col-md-2">
              <input type="date" className="form-control" value={filtros.fechaHasta} onChange={e => setFiltros({...filtros, fechaHasta: e.target.value})} />
           </div>
           <div className="col-md-2">
             <button className="btn btn-primary w-100" onClick={buscar}>Filtrar</button>
           </div>
           <div className="col-md-1">
             <button className="btn btn-outline-secondary w-100" onClick={() => {
                const hoyLocal = obtenerFechaLocal();
                const mañanaLocal = ObtenerFechaMañana();
                setFiltros({cliente: "", estado: "", tipoEntrega: "", fechaDesde: hoyLocal, fechaHasta: mañanaLocal});
             }}>Hoy</button>
           </div>
        </div>
      </div>

      <div className="table-responsive card">
        <table className="table table-hover mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th>#</th>
              <th>Hora</th>
              <th>Cliente</th>
              {/* NUEVA COLUMNA */}
              <th style={{minWidth: '200px'}}>Productos</th>
              <th>Entrega</th>
              <th>Repartidor</th> 
              <th>Estado</th>
              <th>Total</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-4">No hay pedidos en este rango de fechas.</td></tr>
            ) : (
                pedidos.map(p => (
                <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{new Date(p.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                    <td>{p.cliente ? `${p.cliente.nombre} ${p.cliente.apellido}` : 'Final'}</td>
                    
                    {/* LISTA DE PRODUCTOS EN LA TABLA */}
                    <td>
                      <ul className="list-unstyled mb-0 small text-muted">
                        {p.productos && p.productos.map(prod => (
                          <li key={prod.id}>
                             <strong>{prod.PedidoProducto?.cantidad || prod.cantidad}x</strong> {prod.nombre}
                          </li>
                        ))}
                      </ul>
                    </td>

                    <td>{p.tipoEntrega === 'delivery' ? <i className="fas fa-motorcycle text-primary"></i> : <i className="fas fa-store text-secondary"></i>}</td>
                    <td>{p.repartidor ? <span className="small fw-bold">{p.repartidor.nombre}</span> : '-'}</td>
                    <td><span className={`badge bg-${p.estado === 'entregado' ? 'success' : 'warning'}`}>{p.estado}</span></td>
                    <td className="fw-bold">${parseFloat(p.total).toFixed(2)}</td>
                    <td className="text-end">
                      {p.estado !== 'entregado' && p.estado !== 'cancelado' && (
                          <button className="btn btn-sm btn-success me-1" onClick={() => marcarEntregado(p.id)} title="Entregar"><i className="fas fa-check"></i></button>
                      )}
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => navigate(`/pedidos/editar/${p.id}`)}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-outline-info me-1" onClick={() => { setPedidoSeleccionado(p); setModalIsOpen(true); }}><i className="fas fa-eye"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarPedido(p.id)} title="Eliminar"><i className="fas fa-trash"></i></button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <ModalDetallesPedido pedido={pedidoSeleccionado} abierto={modalIsOpen} onCerrar={() => setModalIsOpen(false)} />
    </div>
  );
};
export default Pedidos;