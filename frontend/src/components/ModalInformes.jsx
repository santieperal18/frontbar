import React, { useState } from 'react';
import Modal from 'react-modal';
import reportesService from '../services/reportes.service';

Modal.setAppElement('#root');

const ModalInformes = ({ abierto, onCerrar, tipoReporte, parametrosIniciales }) => {
  const [cargando, setCargando] = useState(false);
  
  // Filtros locales
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const descargarPDF = async () => {
    try {
      setCargando(true);
      
      // Armamos los parámetros según el tipo de reporte elegido
      let params = {};
      if (tipoReporte === 'diario') params = { fecha };
      if (tipoReporte === 'semanal') params = { fechaInicio: fecha };
      if (tipoReporte === 'mensual') params = { anio, mes };
      if (tipoReporte === 'cliente') params = parametrosIniciales;

      // 1. Llamamos al servicio (devuelve un Blob)
      const blob = await reportesService.generarPDF(tipoReporte, params);
      
      // 2. Creamos un enlace invisible en el navegador
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      // Nombre del archivo a descargar
      link.setAttribute('download', `reporte-${tipoReporte}-${Date.now()}.pdf`);
      
      // 3. Forzamos el clic y limpiamos
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Hubo un error al generar el archivo PDF.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      isOpen={abierto}
      onRequestClose={onCerrar}
      className="modal-dialog modal-dialog-centered"
      overlayClassName="modal-backdrop-show"
    >
      <div className="modal-content">
        <div className="modal-header bg-primary text-white">
          <h5 className="modal-title">Generar Reporte: {tipoReporte?.toUpperCase()}</h5>
          <button type="button" className="btn-close btn-close-white" onClick={onCerrar}></button>
        </div>
        <div className="modal-body">
          
          <p className="text-muted mb-4">Seleccione los filtros para generar el documento PDF.</p>

          {/* Filtro Fecha (Diario/Semanal) */}
          {(tipoReporte === 'diario' || tipoReporte === 'semanal') && (
            <div className="mb-3">
              <label className="form-label">Seleccionar Fecha:</label>
              <input 
                type="date" 
                className="form-control" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)} 
              />
            </div>
          )}

          {/* Filtro Mes/Año (Mensual) */}
          {tipoReporte === 'mensual' && (
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Mes</label>
                <select className="form-select" value={mes} onChange={e => setMes(e.target.value)}>
                    {[...Array(12)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Año</label>
                <input type="number" className="form-control" value={anio} onChange={e => setAnio(e.target.value)} />
              </div>
            </div>
          )}

          {tipoReporte === 'cliente' && (
            <div className="alert alert-info">
                Generando reporte para cliente ID: <strong>{parametrosIniciales?.idCliente}</strong>
            </div>
          )}

          <div className="d-grid gap-2 mt-4">
            <button className="btn btn-success btn-lg" onClick={descargarPDF} disabled={cargando}>
              {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generando...
                  </>
              ) : (
                  <>
                    <i className="fas fa-file-pdf me-2"></i> Descargar PDF
                  </>
              )}
            </button>
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default ModalInformes;