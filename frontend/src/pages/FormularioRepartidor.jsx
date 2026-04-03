import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import repartidoresService from "../services/repartidores.service";

const FormularioRepartidor = () => {
  const { id } = useParams();
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      vehiculo: "",
      activo: true
    }
  });

  useEffect(() => {
    if (id) {
      cargarRepartidor();
    }
  }, [id]);

  const cargarRepartidor = async () => {
    try {
      setCargando(true);
      const repartidor = await repartidoresService.obtenerPorId(id);
      reset(repartidor);
    } catch (error) {
      console.error("Error cargando repartidor:", error);
      alert("Error al cargar los datos del repartidor");
      navigate("/repartidores");
    } finally {
      setCargando(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setCargando(true);
      
      if (id) {
        await repartidoresService.actualizar(id, data);
        alert("Repartidor actualizado exitosamente");
      } else {
        await repartidoresService.crear(data);
        alert("Repartidor creado exitosamente");
      }
      
      navigate("/repartidores");
    } catch (error) {
      console.error("Error guardando repartidor:", error);
      alert(error.response?.data?.error || "Error al guardar el repartidor");
    } finally {
      setCargando(false);
    }
  };

  if (cargando && id) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando datos del repartidor...</p>
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
                <i className={`fas ${id ? 'fa-edit' : 'fa-user-plus'} me-2`}></i>
                {id ? "Editar Repartidor" : "Nuevo Repartidor"}
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-user me-2 text-primary"></i>
                      Nombre <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      {...register("nombre", { 
                        required: "El nombre es obligatorio",
                        minLength: { value: 2, message: "Mínimo 2 caracteres" }
                      })}
                      placeholder="Ej: Juan"
                    />
                    {errors.nombre && (
                      <div className="invalid-feedback">{errors.nombre.message}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-user me-2 text-primary"></i>
                      Apellido <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                      {...register("apellido", { 
                        required: "El apellido es obligatorio",
                        minLength: { value: 2, message: "Mínimo 2 caracteres" }
                      })}
                      placeholder="Ej: Pérez"
                    />
                    {errors.apellido && (
                      <div className="invalid-feedback">{errors.apellido.message}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-phone me-2 text-primary"></i>
                      Teléfono <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                      {...register("telefono", { 
                        required: "El teléfono es obligatorio",
                        pattern: {
                          value: /^[0-9+\-\s()]*$/,
                          message: "Formato de teléfono inválido"
                        }
                      })}
                      placeholder="Ej: 351-1234567"
                    />
                    {errors.telefono && (
                      <div className="invalid-feedback">{errors.telefono.message}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-motorcycle me-2 text-primary"></i>
                      Vehículo
                    </label>
                    <select
                      className={`form-control ${errors.vehiculo ? 'is-invalid' : ''}`}
                      {...register("vehiculo")}
                    >
                      <option value="">Seleccionar vehículo...</option>
                      <option value="Moto 110cc">Moto 110cc</option>
                      <option value="Moto 125cc">Moto 125cc</option>
                      <option value="Moto 150cc">Moto 150cc</option>
                      <option value="Auto chico">Auto chico</option>
                      <option value="Auto mediano">Auto mediano</option>
                      <option value="Bicicleta">Bicicleta</option>
                      <option value="Cuadriciclo">Cuadriciclo</option>
                      <option value="Otro">Otro (especificar en observaciones)</option>
                    </select>
                    {errors.vehiculo && (
                      <div className="invalid-feedback">{errors.vehiculo.message}</div>
                    )}
                  </div>
                </div>

                {id && (
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="activo"
                        {...register("activo")}
                      />
                      <label className="form-check-label" htmlFor="activo">
                        Repartidor activo
                      </label>
                    </div>
                    <small className="text-muted">
                      Los repartidores inactivos no aparecerán en las listas de asignación.
                    </small>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/repartidores")}
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
                        {id ? "Actualizar Repartidor" : "Crear Repartidor"}
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
              <li>El teléfono debe ser único para cada repartidor.</li>
              <li>Los repartidores inactivos no podrán ser asignados a pedidos.</li>
              <li>El tipo de vehículo ayuda a optimizar las rutas de entrega.</li>
              <li>Mantenga actualizada la información de contacto.</li>
            </ul>
          </div>

          {/* Vista previa del repartidor */}
          <div className="card mt-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">
                <i className="fas fa-eye me-2"></i>
                Vista Previa del Repartidor
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-motorcycle fa-2x"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h5 className="mb-1">
                    {watch("nombre") || "Nombre"} {watch("apellido") || "Apellido"}
                  </h5>
                  <p className="mb-1">
                    <i className="fas fa-phone me-2 text-muted"></i>
                    {watch("telefono") || "Teléfono no especificado"}
                  </p>
                  <p className="mb-0">
                    <i className="fas fa-car me-2 text-muted"></i>
                    {watch("vehiculo") || "Vehículo no especificado"}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`badge bg-${watch("activo") ? 'success' : 'danger'}`}>
                    {watch("activo") ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Agregar watch para ver los valores del formulario
const watch = () => {
  // Esta función sería proporcionada por react-hook-form
  // En un componente real, se usaría useWatch de react-hook-form
  return {};
};

export default FormularioRepartidor;