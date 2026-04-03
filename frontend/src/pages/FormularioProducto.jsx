import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import productosService from "../services/productos.service";
import categoriasService from "../services/categorias.service";

const FormularioProducto = () => {
  const { id } = useParams();
  const [cargando, setCargando] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      precio: "",
      idCategoria: "",
      disponible: true,
      imagen: ""
    }
  });

  useEffect(() => {
    cargarCategorias();
    if (id) {
      cargarProducto();
    }
  }, [id]);

  const cargarCategorias = async () => {
    try {
      const data = await categoriasService.obtenerTodos();
      setCategorias(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      alert("Error al cargar las categorías");
    }
  };

  const cargarProducto = async () => {
    try {
      setCargando(true);
      const producto = await productosService.obtenerPorId(id);
      reset(producto);
    } catch (error) {
      console.error("Error cargando producto:", error);
      alert("Error al cargar los datos del producto");
      navigate("/productos");
    } finally {
      setCargando(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setCargando(true);
      
      // Convertir precio a número
      data.precio = parseFloat(data.precio);
      
      if (id) {
        await productosService.actualizar(id, data);
        alert("Producto actualizado exitosamente");
      } else {
        await productosService.crear(data);
        alert("Producto creado exitosamente");
      }
      
      navigate("/productos");
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert(error.response?.data?.error || "Error al guardar el producto");
    } finally {
      setCargando(false);
    }
  };

  const idCategoriaSeleccionada = watch("idCategoria");
  const categoriaSeleccionada = categorias.find(c => c.id == idCategoriaSeleccionada);

  if (cargando && id) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className={`fas ${id ? 'fa-edit' : 'fa-hamburger'} me-2`}></i>
                {id ? "Editar Producto" : "Nuevo Producto"}
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label">
                      <i className="fas fa-tag me-2 text-primary"></i>
                      Nombre del Producto <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      {...register("nombre", { 
                        required: "El nombre es obligatorio",
                        minLength: { value: 3, message: "Mínimo 3 caracteres" }
                      })}
                      placeholder="Ej: Café Americano"
                    />
                    {errors.nombre && (
                      <div className="invalid-feedback">{errors.nombre.message}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      <i className="fas fa-dollar-sign me-2 text-primary"></i>
                      Precio <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control ${errors.precio ? 'is-invalid' : ''}`}
                        {...register("precio", { 
                          required: "El precio es obligatorio",
                          min: { value: 0.01, message: "El precio debe ser mayor a 0" }
                        })}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.precio && (
                      <div className="invalid-feedback">{errors.precio.message}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-align-left me-2 text-primary"></i>
                    Descripción
                  </label>
                  <textarea
                    className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                    {...register("descripcion")}
                    rows="3"
                    placeholder="Descripción detallada del producto..."
                  />
                  {errors.descripcion && (
                    <div className="invalid-feedback">{errors.descripcion.message}</div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-layer-group me-2 text-primary"></i>
                      Categoría <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.idCategoria ? 'is-invalid' : ''}`}
                      {...register("idCategoria", { 
                        required: "La categoría es obligatoria" 
                      })}
                    >
                      <option value="">Seleccionar categoría...</option>
                      <option value="1">Desayuno</option>
                      <option value="2">Comida</option>
                    </select>
                    {errors.idCategoria && (
                      <div className="invalid-feedback">{errors.idCategoria.message}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-image me-2 text-primary"></i>
                      URL de la Imagen
                    </label>
                    <input
                      type="url"
                      className={`form-control ${errors.imagen ? 'is-invalid' : ''}`}
                      {...register("imagen", {
                        pattern: {
                          value: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
                          message: "URL de imagen inválida"
                        }
                      })}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    {errors.imagen && (
                      <div className="invalid-feedback">{errors.imagen.message}</div>
                    )}
                    <small className="text-muted">
                      Formato: JPG, PNG, GIF, WebP
                    </small>
                  </div>
                </div>

                {id && (
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="disponible"
                        {...register("disponible")}
                      />
                      <label className="form-check-label" htmlFor="disponible">
                        Producto disponible
                      </label>
                    </div>
                  </div>
                )}

                {/* Vista previa del producto */}
                {(watch("nombre") || watch("imagen") || watch("precio")) && (
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="fas fa-eye me-2"></i>
                        Vista Previa
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-3">
                          {watch("imagen") ? (
                            <img
                              src={watch("imagen")}
                              alt="Vista previa"
                              className="img-fluid rounded"
                              style={{ maxHeight: '150px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/150x150?text=Sin+Imagen';
                              }}
                            />
                          ) : (
                            <div className="text-center py-4 bg-light rounded">
                              <i className="fas fa-image fa-3x text-muted"></i>
                              <p className="mt-2 text-muted">Sin imagen</p>
                            </div>
                          )}
                        </div>
                        <div className="col-md-9">
                          <h5>{watch("nombre") || "Nombre del producto"}</h5>
                          <p className="text-muted">
                            {watch("descripcion") || "Descripción del producto..."}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="badge bg-primary">
                              {categoriaSeleccionada?.nombre || "Categoría"}
                            </span>
                            <span className="h4 text-success mb-0">
                              ${watch("precio") ? parseFloat(watch("precio")).toFixed(2) : "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/productos")}
                    disabled={cargando}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Volver
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={cargando}
                  >
                    {cargando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className={`fas ${id ? 'fa-save' : 'fa-check'} me-2`}></i>
                        {id ? "Actualizar Producto" : "Crear Producto"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Información adicional */}
          <div className="alert alert-info mt-4">
            <h6 className="alert-heading">
              <i className="fas fa-info-circle me-2"></i>
              Información importante
            </h6>
            <ul className="mb-0">
              <li>Los campos marcados con <span className="text-danger">*</span> son obligatorios.</li>
              <li>El nombre del producto debe ser único.</li>
              <li>Los productos no disponibles no aparecerán en el menú.</li>
              <li>La categoría determina si es desayuno, comida o bebida.</li>
              <li>El precio debe ser mayor a cero.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioProducto;