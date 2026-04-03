import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import productosService from "../services/productos.service";
import categoriasService from "../services/categorias.service";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    texto: "",
    categoria: "",
    tipo: "",
    soloDisponibles: true
  });
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [productosData, categoriasData] = await Promise.all([
        productosService.obtenerTodos(),
        categoriasService.obtenerTodos()
      ]);
      setProductos(productosData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  const buscarProductos = async () => {
    try {
      setCargando(true);
      let productosFiltrados = [...productos];

      // Filtrar por texto
      if (filtros.texto) {
        const textoLower = filtros.texto.toLowerCase();
        productosFiltrados = productosFiltrados.filter(p =>
          p.nombre.toLowerCase().includes(textoLower) ||
          p.descripcion?.toLowerCase().includes(textoLower)
        );
      }

      // Filtrar por categoría
      if (filtros.categoria) {
        productosFiltrados = productosFiltrados.filter(p =>
          p.idCategoria === parseInt(filtros.categoria)
        );
      }

      // Filtrar por tipo
      if (filtros.tipo) {
        const categoriaTipo = categorias.find(c => c.tipo === filtros.tipo);
        if (categoriaTipo) {
          productosFiltrados = productosFiltrados.filter(p =>
            p.idCategoria === categoriaTipo.id
          );
        }
      }

      // Filtrar por disponibilidad
      if (filtros.soloDisponibles) {
        productosFiltrados = productosFiltrados.filter(p => p.disponible);
      }

      setProductos(productosFiltrados);
    } catch (error) {
      console.error("Error filtrando productos:", error);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      texto: "",
      categoria: "",
      tipo: "",
      soloDisponibles: true
    });
    cargarDatos();
  };

  const eliminarProducto = async (id) => {
    if (confirm("¿Está seguro de que desea eliminar este producto?")) {
      try {
        await productosService.eliminar(id);
        alert("Producto eliminado exitosamente");
        cargarDatos();
      } catch (error) {
        alert("Error al eliminar el producto");
      }
    }
  };

  const getTipoCategoria = (idCategoria) => {
    const categoria = categorias.find(c => c.id === idCategoria);
    return categoria ? categoria.tipo : "Desconocido";
  };

  const getNombreCategoria = (idCategoria) => {
    const categoria = categorias.find(c => c.id === idCategoria);
    return categoria ? categoria.nombre : "Desconocida";
  };

  if (cargando) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-hamburger me-3 text-primary"></i>
          Gestión de Productos
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/productos/nuevo")}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros de Búsqueda
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o descripción..."
                value={filtros.texto}
                onChange={(e) => setFiltros({...filtros, texto: e.target.value})}
              />
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtros.categoria}
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
              >
                <option value="">Todos los tipos</option>
                <option value="desayuno">Desayunos</option>
                <option value="comida">Comidas</option>
                <option value="bebida">Bebidas</option>
              </select>
            </div>
            
            <div className="col-md-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="soloDisponibles"
                  checked={filtros.soloDisponibles}
                  onChange={(e) => setFiltros({...filtros, soloDisponibles: e.target.checked})}
                />
                <label className="form-check-label" htmlFor="soloDisponibles">
                  Solo disponibles
                </label>
              </div>
            </div>
            
            <div className="col-12">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={buscarProductos}
                >
                  <i className="fas fa-search me-2"></i>
                  Buscar
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
              <h6 className="card-title">Total Productos</h6>
              <h2 className="mb-0">{productos.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body text-center">
              <h6 className="card-title">Disponibles</h6>
              <h2 className="mb-0">{productos.filter(p => p.disponible).length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body text-center">
              <h6 className="card-title">Desayunos</h6>
              <h2 className="mb-0">
                {productos.filter(p => getTipoCategoria(p.idCategoria) === 'desayuno').length}
              </h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info">
            <div className="card-body text-center">
              <h6 className="card-title">Comidas</h6>
              <h2 className="mb-0">
                {productos.filter(p => getTipoCategoria(p.idCategoria) === 'comida').length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Lista de Productos
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th className="text-end">Precio</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <i className="fas fa-box-open fa-2x text-muted mb-3"></i>
                      <p className="text-muted">No se encontraron productos</p>
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>#{producto.id}</td>
                      <td>
                        <strong>{producto.nombre}</strong>
                        {producto.imagen && (
                          <span className="ms-2">
                            <i className="fas fa-image text-info" title="Tiene imagen"></i>
                          </span>
                        )}
                      </td>
                      <td>
                        {producto.descripcion || 
                          <span className="text-muted">Sin descripción</span>}
                      </td>
                      <td>{getNombreCategoria(producto.idCategoria)}</td>
                      <td>
                        <span className={`badge bg-${getTipoBadgeColor(getTipoCategoria(producto.idCategoria))}`}>
                          {getTipoCategoria(producto.idCategoria)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="h6 text-success">
                          ${parseFloat(producto.precio).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${producto.disponible ? 'success' : 'danger'}`}>
                          {producto.disponible ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/productos/editar/${producto.id}`)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarProducto(producto.id)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => {
                              // Aquí podrías agregar lógica para ver en el menú
                              alert(`Producto: ${producto.nombre}\nPrecio: $${producto.precio}`);
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

      {/* Botón flotante para nuevo producto */}
      <button
        className="btn btn-primary btn-lg rounded-circle position-fixed"
        style={{ bottom: '80px', right: '20px', width: '60px', height: '60px' }}
        onClick={() => navigate("/productos/nuevo")}
        title="Nuevo Producto"
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

// Función auxiliar para color de badge según tipo
const getTipoBadgeColor = (tipo) => {
  switch(tipo) {
    case 'desayuno': return 'warning';
    case 'comida': return 'success';
    case 'bebida': return 'info';
    default: return 'secondary';
  }
};

export default Productos;