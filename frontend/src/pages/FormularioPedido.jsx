import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import pedidosService from "../services/pedidos.service";
import clientesService from "../services/clientes.service";
import productosService from "../services/productos.service";
import repartidoresService from "../services/repartidores.service";

const FormularioPedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [repartidores, setRepartidores] = useState([]); 
  const [carrito, setCarrito] = useState([]);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { tipoEntrega: "local" }
  });
  
  const tipoEntrega = watch("tipoEntrega");

  useEffect(() => {
    const init = async () => {
      const [cli, prod, rep] = await Promise.all([
          clientesService.obtenerTodos(), 
          productosService.obtenerTodos(),
          repartidoresService.obtenerTodos() 
      ]);
      
      setClientes(cli);
      setProductos(prod);
      setRepartidores(rep);
      
      if (id) { 
        const pedido = await pedidosService.obtenerPorId(id);
        setValue("idCliente", pedido.idCliente);
        setValue("tipoEntrega", pedido.tipoEntrega);
        setValue("estado", pedido.estado);
        setValue("observaciones", pedido.observaciones);
        setValue("direccionEntrega", pedido.direccionEntrega);
        setValue("idRepartidor", pedido.idRepartidor); 
        
        if (pedido.productos) {
            setCarrito(pedido.productos.map(p => ({
                id: p.id,
                nombre: p.nombre,
                precio: parseFloat(p.PedidoProducto?.precioUnitario || p.precio),
                cantidad: p.PedidoProducto?.cantidad || 1
            })));
        }
      }
    };
    init();
  }, [id, setValue]);

  const agregar = (prod) => {
    const existe = carrito.find(i => i.id === prod.id);
    if(existe) {
        setCarrito(carrito.map(i => i.id === prod.id ? {...i, cantidad: i.cantidad + 1} : i));
    } else {
        setCarrito([...carrito, { id: prod.id, nombre: prod.nombre, precio: parseFloat(prod.precio), cantidad: 1 }]);
    }
  };

  const quitar = (id) => setCarrito(carrito.filter(i => i.id !== id));
  const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

  const onSubmit = async (data) => {
    if(carrito.length === 0) return alert("Agrega productos");
    
    if (data.tipoEntrega === 'local') {
        data.idRepartidor = null;
    }

    // CORRECCIÓN CLAVE: Enviamos la fecha de AHORA explícitamente desde el cliente
    // Esto asegura que si son las 23:00 en tu PC, se guarde como las 23:00 de HOY para el filtro.
    const fechaActual = new Date(); 

    const payload = { 
        ...data, 
        fecha: fechaActual, // Forzamos fecha cliente
        productos: carrito.map(i => ({ id: i.id, cantidad: i.cantidad, precio: i.precio })) 
    };
    
    try {
        setCargando(true);
        id ? await pedidosService.actualizar(id, payload) : await pedidosService.crear(payload);
        navigate("/pedidos");
    } catch(e) { alert("Error al guardar"); } finally { setCargando(false); }
  };

  return (
    <div className="container py-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3>{id ? "Editar Pedido" : "Nuevo Pedido"}</h3>
        </div>
        <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <label className="form-label">Cliente</label>
                        <select className="form-select" {...register("idCliente", {required: true})}>
                            <option value="">Seleccionar...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                        </select>
                    </div>
                    
                    <div className="col-md-3">
                        <label className="form-label">Entrega</label>
                        <select className="form-select" {...register("tipoEntrega")}>
                            <option value="local">Local</option>
                            <option value="delivery">Delivery</option>
                        </select>
                    </div>

                    {tipoEntrega === 'delivery' && (
                        <div className="col-md-3">
                            <label className="form-label text-primary fw-bold">Asignar Repartidor</label>
                            <select className="form-select border-primary" {...register("idRepartidor")}>
                                <option value="">Sin asignar...</option>
                                {repartidores.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.nombre} {r.apellido} 
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {id && (
                        <div className="col-md-3">
                            <label className="form-label">Estado</label>
                            <select className="form-select" {...register("estado")}>
                                <option value="pendiente">Pendiente</option>
                                <option value="preparando">Preparando</option>
                                <option value="en_camino">En Camino</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                    )}

                    {tipoEntrega === 'delivery' && (
                        <div className="col-12">
                             <label className="form-label">Dirección de Entrega</label>
                             <input type="text" className="form-control" {...register("direccionEntrega")} placeholder="Calle, Número, Barrio..." />
                        </div>
                    )}
                </div>

                <div className="row">
                    <div className="col-md-6" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        <h5>Productos</h5>
                        {productos.map(p => (
                            <div key={p.id} className="d-flex justify-content-between border-bottom p-2">
                                <span>{p.nombre} (${p.precio})</span>
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => agregar(p)}>+</button>
                            </div>
                        ))}
                    </div>
                    <div className="col-md-6">
                        <h5>Carrito (Total: ${total.toFixed(2)})</h5>
                        <ul className="list-group">
                            {carrito.map(item => (
                                <li key={item.id} className="list-group-item d-flex justify-content-between">
                                    {item.nombre} x {item.cantidad}
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => quitar(item.id)}>X</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-4 text-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={() => navigate("/pedidos")}>Cancelar</button>
                    <button type="submit" className="btn btn-success" disabled={cargando}>Guardar Pedido</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioPedido;