import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axios.config.js';
import './Login.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await axios.post('/auth/login', {
        usuario,
        contrasena
      });

      // Guardar el token en localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', response.data.usuario);

      // Redirigir a la página principal
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🍽️ Resto Bar</h1>
          <p>Sistema de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              className="form-control"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              disabled={cargando}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              type="password"
              id="contrasena"
              className="form-control"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              disabled={cargando}
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-login w-100"
            disabled={cargando || !usuario || !contrasena}
          >
            {cargando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-muted small">
            <strong>Demo:</strong> usuario: <code>main</code> | contraseña: <code>main123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
