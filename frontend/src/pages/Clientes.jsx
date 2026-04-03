import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clientesService from "../services/clientes.service";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const data = await clientesService.obtenerTodos();
      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      alert("Error al cargar los clientes");
    } finally {
      setCargando(false);
    }
  };

  const buscarClientes = async () => {
    try {
      if (filtro.trim()) {
        const data = await clientesService.buscarPorNombre(filtro);
        setClientes(data);
      } else {
        cargarClientes();
      }
    } catch (error) {
      console.error("Error buscando clientes:", error);
    }
  };

  const eliminarCliente = async (id) => {
    if (confirm("¿Está seguro de que desea eliminar este cliente?")) {
      try {
        await clientesService.eliminar(id);
        alert("Cliente eliminado exitosamente");
        cargarClientes();
      } catch (error) {
        alert("Error al eliminar el cliente");
      }
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'No registrada';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  if (cargando) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-users me-3 text-primary"></i>
          Gestión de Clientes
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/clientes/nuevo")}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Cliente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o apellido..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarClientes()}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={buscarClientes}
                >
                  Buscar
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setFiltro("");
                    cargarClientes();
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary">
            <div className="card-body text-center">
              <h6 className="card-title">Total Clientes</h6>
              <h2 className="mb-0">{clientes.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body text-center">
              <h6 className="card-title">Clientes Activos</h6>
              <h2 className="mb-0">{clientes.filter(c => c.activo).length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info">
            <div className="card-body text-center">
              <h6 className="card-title">Con Email</h6>
              <h2 className="mb-0">{clientes.filter(c => c.email).length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body text-center">
              <h6 className="card-title">Con Dirección</h6>
              <h2 className="mb-0">{clientes.filter(c => c.direccion).length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="card">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Lista de Clientes
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <i className="fas fa-user-slash fa-2x text-muted mb-3"></i>
                      <p className="text-muted">No se encontraron clientes</p>
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>#{cliente.id}</td>
                      <td>{cliente.nombre}</td>
                      <td>{cliente.apellido}</td>
                      <td>{cliente.telefono || <span className="text-muted">No especificado</span>}</td>
                      <td>
                        {cliente.email ? (
                          <a href={`mailto:${cliente.email}`} className="text-decoration-none">
                            {cliente.email}
                          </a>
                        ) : (
                          <span className="text-muted">No especificado</span>
                        )}
                      </td>
                      <td>{cliente.direccion || <span className="text-muted">No especificado</span>}</td>
                      <td>{formatearFecha(cliente.fechaRegistro)}</td>
                      <td>
                        <span className={`badge bg-${cliente.activo ? 'success' : 'danger'}`}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarCliente(cliente.id)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => navigate(`/reportes/cliente/${cliente.id}`)}
                            title="Ver Reporte"
                          >
                            <i className="fas fa-chart-bar"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Botón flotante para nuevo cliente */}
      <button
        className="btn btn-primary btn-lg rounded-circle position-fixed"
        style={{ bottom: '80px', right: '20px', width: '60px', height: '60px' }}
        onClick={() => navigate("/clientes/nuevo")}
        title="Nuevo Cliente"
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default Clientes;