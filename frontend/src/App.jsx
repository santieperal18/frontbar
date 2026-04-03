import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Encabezado from "./components/Encabezado";
import PiePagina from "./components/PiePagina";
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas
import Login from './pages/Login';
import Pedidos from './pages/Pedidos';
import FormularioPedido from './pages/FormularioPedido';
import Clientes from './pages/Clientes';
import FormularioCliente from './pages/FormularioCliente';
import Productos from './pages/Productos';
import FormularioProducto from './pages/FormularioProducto';
import Repartidores from './pages/Repartidores';
import FormularioRepartidor from './pages/FormularioRepartidor';
import Reportes from './pages/Reportes';

import './App.css';
import './styles/professional.css';
import './styles/restoBar.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="resto-bg min-vh-100 d-flex flex-column">
                <Encabezado />
                <main className="flex-grow-1 py-4">
                  <div className="container-fluid">
                    <Routes>
                      <Route path="/" element={<Pedidos />} />
                      <Route path="/pedidos" element={<Pedidos />} />
                      <Route path="/pedidos/nuevo" element={<FormularioPedido />} />
                      <Route path="/pedidos/editar/:id" element={<FormularioPedido />} />
                      <Route path="/pedidos/duplicar/:id" element={<FormularioPedido duplicar={true} />} />
                      
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/clientes/nuevo" element={<FormularioCliente />} />
                      <Route path="/clientes/editar/:id" element={<FormularioCliente />} />
                      
                      <Route path="/productos" element={<Productos />} />
                      <Route path="/productos/nuevo" element={<FormularioProducto />} />
                      <Route path="/productos/editar/:id" element={<FormularioProducto />} />
                      
                      <Route path="/repartidores" element={<Repartidores />} />
                      <Route path="/repartidores/nuevo" element={<FormularioRepartidor />} />
                      <Route path="/repartidores/editar/:id" element={<FormularioRepartidor />} />
                      
                      <Route path="/reportes" element={<Reportes />} />
                      <Route path="/reportes/cliente/:id" element={<Reportes clienteId={true} />} />
                      <Route path="/reportes/:tipo" element={<Reportes />} />
                    </Routes>
                  </div>
                </main>
                <PiePagina />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;