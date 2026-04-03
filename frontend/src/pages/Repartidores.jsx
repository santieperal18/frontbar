import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import repartidoresService from "../services/repartidores.service";

const Repartidores = () => {
  const [repartidores, setRepartidores] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarRepartidores();
  }, []);

  const cargarRepartidores = async () => {
    try {
      setCargando(true);
      const data = await repartidoresService.obtenerTodos();
      setRepartidores(data);
    } catch (error) {
      console.error("Error cargando repartidores:", error);
      alert("Error al cargar los repartidores");
    } finally {
      setCargando(false);
    }
  };

  const buscarRepartidores = async () => {
    try {
      if (filtro.trim()) {
        const data = await repartidoresService.buscarPorNombre(filtro);
        setRepartidores(data);
      } else {
        cargarRepartidores();
      }
    } catch (error) {
      console.error("Error buscando repartidores:", error);
    }
  };

  const eliminarRepartidor = async (id) => {
    if (confirm("¿Está seguro de que desea eliminar este repartidor?")) {
      try {
        await repartidoresService.eliminar(id);
        alert("Repartidor eliminado exitosamente");
        cargarRepartidores();
      } catch (error) {
        alert("Error al eliminar el repartidor");
      }
    }
  };

  const filtrarRepartidores = () => {
    let filtrados = [...repartidores];
    
    if (filtro.trim()) {
      const textoLower = filtro.toLowerCase();
      filtrados = filtrados.filter(r =>
        r.nombre.toLowerCase().includes(textoLower) ||
        r.apellido.toLowerCase().includes(textoLower) ||
        r.telefono.toLowerCase().includes(textoLower) ||
        r.vehiculo?.toLowerCase().includes(textoLower)
      );
    }
    
    if (soloActivos) {
      filtrados = filtrados.filter(r => r.activo);
    }
    
    setRepartidores(filtrados);
  };

  const limpiarFiltros = () => {
    setFiltro("");
    setSoloActivos(true);
    cargarRepartidores();
  };

  const getVehiculoIcon = (vehiculo) => {
    if (!vehiculo) return "fa-question";
    if (vehiculo.toLowerCase().includes('moto')) return "fa-motorcycle";
    if (vehiculo.toLowerCase().includes('auto') || vehiculo.toLowerCase().includes('carro')) return "fa-car";
    if (vehiculo.toLowerCase().includes('bici')) return "fa-bicycle";
    return "fa-truck";
  };

  if (cargando) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando repartidores...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-motorcycle me-3 text-primary"></i>
          Gestión de Repartidores
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/repartidores/nuevo")}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Repartidor
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, apellido, teléfono o vehículo..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarRepartidores()}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloActivos"
                  checked={soloActivos}
                  onChange={(e) => setSoloActivos(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="soloActivos">
                  Solo repartidores activos
                </label>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={filtrarRepartidores}
                >
                  <i className="fas fa-filter me-2"></i>
                  Filtrar
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={limpiarFiltros}
                >
                  <i className="fas fa-times me-2"></i>
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
              <h6 className="card-title">Total Repartidores</h6>
              <h2 className="mb-0">{repartidores.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body text-center">
              <h6 className="card-title">Activos</h6>
              <h2 className="mb-0">{repartidores.filter(r => r.activo).length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info">
            <div className="card-body text-center">
              <h6 className="card-title">Con Motos</h6>
              <h2 className="mb-0">
                {repartidores.filter(r => r.vehiculo?.toLowerCase().includes('moto')).length}
              </h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body text-center">
              <h6 className="card-title">Con Autos</h6>
              <h2 className="mb-0">
                {repartidores.filter(r => 
                  r.vehiculo?.toLowerCase().includes('auto') || 
                  r.vehiculo?.toLowerCase().includes('carro')
                ).length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de repartidores */}
      <div className="card">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Lista de Repartidores
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
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {repartidores.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <i className="fas fa-user-slash fa-2x text-muted mb-3"></i>
                      <p className="text-muted">No se encontraron repartidores</p>
                    </td>
                  </tr>
                ) : (
                  repartidores.map((repartidor) => (
                    <tr key={repartidor.id}>
                      <td>#{repartidor.id}</td>
                      <td>{repartidor.nombre}</td>
                      <td>{repartidor.apellido}</td>
                      <td>
                        <a 
                          href={`tel:${repartidor.telefono}`} 
                          className="text-decoration-none"
                        >
                          {repartidor.telefono}
                        </a>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className={`fas ${getVehiculoIcon(repartidor.vehiculo)} me-2 text-primary`}></i>
                          <span>{repartidor.vehiculo || "No especificado"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${repartidor.activo ? 'success' : 'danger'}`}>
                          {repartidor.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/repartidores/editar/${repartidor.id}`)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarRepartidor(repartidor.id)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => {
                              // Aquí podrías agregar lógica para ver pedidos asignados
                              alert(`Repartidor: ${repartidor.nombre} ${repartidor.apellido}\nTel: ${repartidor.telefono}`);
                            }}
                            title="Ver Detalles"
                          >
                            <i className="fas fa-eye"></i>
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

      {/* Información adicional */}
      <div className="alert alert-warning mt-4">
        <h6 className="alert-heading">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Notas importantes
        </h6>
        <ul className="mb-0">
          <li>Los repartidores inactivos no aparecerán en las listas de asignación.</li>
          <li>Solo se pueden asignar repartidores activos a los pedidos de delivery.</li>
          <li>Es importante mantener actualizada la información de contacto.</li>
          <li>El tipo de vehículo ayuda a optimizar las rutas de entrega.</li>
        </ul>
      </div>

      {/* Botón flotante para nuevo repartidor */}
      <button
        className="btn btn-primary btn-lg rounded-circle position-fixed"
        style={{ bottom: '80px', right: '20px', width: '60px', height: '60px' }}
        onClick={() => navigate("/repartidores/nuevo")}
        title="Nuevo Repartidor"
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default Repartidores;