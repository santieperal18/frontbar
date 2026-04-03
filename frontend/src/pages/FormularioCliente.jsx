import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import clientesService from "../services/clientes.service";

const FormularioCliente = () => {
  const { id } = useParams();
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      direccion: "",
      activo: true
    }
  });

  useEffect(() => {
    if (id) {
      cargarCliente();
    }
  }, [id]);

  const cargarCliente = async () => {
    try {
      setCargando(true);
      const cliente = await clientesService.obtenerPorId(id);
      reset(cliente);
    } catch (error) {
      console.error("Error cargando cliente:", error);
      alert("Error al cargar los datos del cliente");
      navigate("/clientes");
    } finally {
      setCargando(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setCargando(true);
      
      if (id) {
        await clientesService.actualizar(id, data);
        alert("Cliente actualizado exitosamente");
      } else {
        await clientesService.crear(data);
        alert("Cliente creado exitosamente");
      }
      
      navigate("/clientes");
    } catch (error) {
      console.error("Error guardando cliente:", error);
      alert(error.response?.data?.error || "Error al guardar el cliente");
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
        <p className="mt-3">Cargando datos del cliente...</p>
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
                {id ? "Editar Cliente" : "Nuevo Cliente"}
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
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                      {...register("telefono", {
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
                      <i className="fas fa-envelope me-2 text-primary"></i>
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register("email", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email inválido"
                        }
                      })}
                      placeholder="ejemplo@email.com"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                    Dirección
                  </label>
                  <textarea
                    className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
                    {...register("direccion")}
                    rows="3"
                    placeholder="Dirección completa para delivery"
                  />
                  {errors.direccion && (
                    <div className="invalid-feedback">{errors.direccion.message}</div>
                  )}
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
                        Cliente activo
                      </label>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/clientes")}
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
                        {id ? "Actualizar Cliente" : "Crear Cliente"}
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
              <li>El email debe ser único para cada cliente.</li>
              <li>Los clientes inactivos no aparecerán en las listas de selección.</li>
              <li>La dirección es importante para los pedidos de delivery.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioCliente;