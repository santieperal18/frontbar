import { NavLink, useNavigate } from 'react-router-dom';

export default function Encabezado() {
    const navigate = useNavigate();
    const usuario = localStorage.getItem('usuario');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    return (
        <>
            {/* Header Resto Bar */}
            <header className="resto-header">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h1 className="mb-2">
                                <i className="fas fa-utensils me-3"></i>
                                Resto Bar "Resto Bar La Esqna"
                            </h1>
                            <p className="subtitle mb-0">
                                Sistema de Gestión de Pedidos - Comidas y Desayunos
                            </p>
                        </div>
                        <div className="col-md-6 text-end">
                            <div className="d-flex align-items-center justify-content-end gap-3">
                                <div>
                                    <i className="fas fa-phone text-white me-2"></i>
                                    <span>+54 351 323-7878</span>
                                </div>
                                <div>
                                    <i className="fas fa-clock text-white me-2"></i>
                                    <span>06:00 - 15:00 hs</span>
                                </div>
                                {usuario && (
                                    <div className="user-info ms-3 ps-3 border-start border-white">
                                        <span className="text-white small">
                                            <i className="fas fa-user me-2"></i>
                                            {usuario}
                                        </span>
                                    </div>
                                )}
                                {usuario && (
                                    <button
                                        className="btn btn-sm btn-outline-light"
                                        onClick={handleLogout}
                                        title="Cerrar sesión"
                                    >
                                        <i className="fas fa-sign-out-alt"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navegación */}
            <nav className="resto-nav">
                <div className="container">
                    <div className="d-flex justify-content-between">
                        <div className="d-flex">
                            <NavLink
                                to="/pedidos"
                                end
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className="fas fa-shopping-cart me-2"></i>
                                Pedidos
                            </NavLink>

                            <NavLink
                                to="/clientes"
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className="fas fa-users me-2"></i>
                                Clientes
                            </NavLink>

                            <NavLink
                                to="/productos"
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className="fas fa-hamburger me-2"></i>
                                Productos
                            </NavLink>
                        </div>
                        
                        <div className="d-flex">
                            <NavLink
                                to="/repartidores"
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className="fas fa-motorcycle me-2"></i>
                                Repartidores
                            </NavLink>

                            <NavLink
                                to="/reportes"
                                end
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className="fas fa-chart-bar me-2"></i>
                                Reportes
                            </NavLink>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}