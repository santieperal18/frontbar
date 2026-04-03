import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import reportesService from "../services/reportes.service";
import clientesService from "../services/clientes.service";
import ModalInformes from "../components/ModalInformes";

const Reportes = ({ clienteId }) => {
  const { id } = useParams();
  
  const [resumenHoy, setResumenHoy] = useState({ total: 0, cantidad: 0 });
  const [productosTopHoy, setProductosTopHoy] = useState([]);
  const [desempenoRepartidores, setDesempenoRepartidores] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoReporte, setTipoReporte] = useState("");
  const [parametrosReporte, setParametrosReporte] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosGenerales();
    if (clienteId || id) {
       abrirModalReporte("cliente", { idCliente: id || clienteId });
    }
  }, [id, clienteId]);

  const cargarDatosGenerales = async () => {
    try {
      setCargando(true);
      const hoy = new Date().toISOString().split('T')[0];

      const clientesData = await clientesService.obtenerTodos();
      setClientes(clientesData);

      const reporteHoy = await reportesService.obtenerVentasDiarias(hoy);
      setResumenHoy({
        total: reporteHoy.totalVentas || 0,
        cantidad: reporteHoy.cantidadPedidos || 0
      });

      // Productos de HOY (inicio=hoy, fin=hoy)
      const topProd = await reportesService.obtenerProductosMasVendidos(hoy, hoy, 5);
      setProductosTopHoy(topProd);

      // Repartidores de HOY
      const topRepartidores = await reportesService.obtenerDesempenoRepartidores(hoy);
      setDesempenoRepartidores(topRepartidores);

    } catch (error) {
      console.error("Error dashboard:", error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalReporte = (tipo, params = {}) => {
    setTipoReporte(tipo);
    setParametrosReporte(params);
    setModalAbierto(true);
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4"><i className="fas fa-chart-line me-2"></i>Panel de Reportes</h2>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <h6 className="card-title">Ventas de Hoy</h6>
              <h2 className="display-6 fw-bold">${resumenHoy.total}</h2>
              <p className="card-text"><i className="fas fa-shopping-bag me-1"></i> {resumenHoy.cantidad} pedidos</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 col-lg-9">
          <div className="card h-100 border-0 bg-light">
            <div className="card-body d-flex align-items-center justify-content-around flex-wrap gap-2">
              <button className="btn btn-outline-primary px-4 py-3" onClick={() => abrirModalReporte('diario')}>
                <i className="fas fa-calendar-day fa-2x d-block mb-2"></i>Diario (PDF)
              </button>
              <button className="btn btn-outline-primary px-4 py-3" onClick={() => abrirModalReporte('semanal')}>
                <i className="fas fa-calendar-week fa-2x d-block mb-2"></i>Semanal (PDF)
              </button>
              <button className="btn btn-outline-primary px-4 py-3" onClick={() => abrirModalReporte('mensual')}>
                <i className="fas fa-calendar-alt fa-2x d-block mb-2"></i>Mensual (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white fw-bold text-success">
              <i className="fas fa-star me-2"></i>Productos Más Vendidos (Hoy)
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {productosTopHoy.length > 0 ? productosTopHoy.map((p, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                    <div><span className="badge bg-secondary me-2">#{i+1}</span>{p.nombre}</div>
                    <span className="fw-bold">{p.total_vendido} un.</span>
                  </li>
                )) : <li className="list-group-item text-muted text-center py-3">Sin ventas hoy</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
             <div className="card-header bg-white fw-bold text-primary">
              <i className="fas fa-motorcycle me-2"></i>Entregas por Repartidor (Hoy)
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {desempenoRepartidores.length > 0 ? desempenoRepartidores.map((r, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                    <div><i className="fas fa-helmet-safety me-2 text-muted"></i>{r.nombre} {r.apellido}</div>
                    <span className="badge bg-primary rounded-pill">{r.cantidad_entregas} envíos</span>
                  </li>
                )) : <li className="list-group-item text-muted text-center py-3">Sin envíos hoy</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
             <div className="card-header bg-white fw-bold text-info">
              <i className="fas fa-user me-2"></i>Reporte por Cliente
            </div>
            <div className="card-body">
              <select className="form-select mb-3" onChange={(e) => {
                  if(e.target.value) abrirModalReporte('cliente', { idCliente: e.target.value });
              }}>
                <option value="">-- Buscar Cliente --</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <ModalInformes abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} tipoReporte={tipoReporte} parametrosIniciales={parametrosReporte} />
    </div>
  );
};

export default Reportes;