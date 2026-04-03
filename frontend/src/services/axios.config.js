import axios from "axios";

const apiUrl = import.meta.env.REACT_APP_API_URL || "http://localhost:3000/api";

const instancia = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000 // 10 segundos
});

// Interceptor para agregar el token JWT a cada request
instancia.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
instancia.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error("Error del servidor:", error.response.data);
      
      // Si es error 401 (no autorizado), limpiar token y redirigir a login
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      console.error("Error de red:", error.request);
    } else {
      // Algo sucedió al configurar la petición
      console.error("Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default instancia;