function PiePagina() {
  return (
    <footer className="resto-footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4">
            <h5>
              <i className="fas fa-utensils me-2"></i>
              Resto Bar "Resto Bar La Esquina"
            </h5>
            <p>
              Servimos los mejores desayunos y comidas con ingredientes frescos 
              y de la más alta calidad. Tu satisfacción es nuestra prioridad.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-white" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-white" aria-label="WhatsApp">
                <i className="fab fa-whatsapp"></i>
              </a>
              <a href="#" className="text-white" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>
          
          <div className="col-md-4 mb-4">
            <h5>
              <i className="fas fa-map-marker-alt me-2"></i>
              Contacto y Ubicación
            </h5>
            <p>
              <i className="fas fa-home me-2"></i>
              25 de Mayo 405, Córdoba Capital
            </p>
            <p>
              <i className="fas fa-phone me-2"></i>
              +54 351 323-7878
            </p>
            <p>
              <i className="fas fa-envelope me-2"></i>
              contacto@restoelbuensabor.com
            </p>
            <p>
              <i className="fas fa-clock me-2"></i>
              Delivery: 11:00 - 15:00 hs
            </p>
          </div>
          
          <div className="col-md-4 mb-4">
            <h5>
              <i className="fas fa-clock me-2"></i>
              Horarios de Atención
            </h5>
            <p>
              <strong>Lunes a Viernes:</strong><br />
              06:00 - 15:00 hs
            </p>
            <p>
              <strong>Sábados:</strong><br />
              08:00 - 12:00 hs
            </p>
            <p>
              <strong>Domingos y Feriados:</strong><br />
              10:00 - 23:00 hs
            </p>
            <p>
              <strong>Delivery Express:</strong><br />
              30 minutos garantizados
            </p>
          </div>
        </div>
        
        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.3)', margin: '2rem 0 1rem' }} />
        
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="mb-0">
              © {new Date().getFullYear()} Resto Bar "Resto Bar La Esquina". Todos los derechos reservados.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0">
              <i className="fas fa-truck me-2"></i>
              Servicio de delivery propio - Área de cobertura: 5km
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PiePagina;