import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

function Navbar() {
    const { user, logout } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar glass-panel">
            <div className="nav-brand">
                <span className="nav-title">LOL RANKING</span>
            </div>
            <div className="nav-links">
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Ranking</Link>
                <Link to="/matchmaker" className={location.pathname === '/matchmaker' ? 'active' : ''}>Organizar Partida</Link>
                <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>Histórico</Link>
                <Link to="/compare" className={location.pathname === '/compare' ? 'active' : ''}>Comparar</Link>
                <Link to="/new-player" className={location.pathname === '/new-player' ? 'active' : ''}>Novo Jogador</Link>
            </div>
            <div className="nav-user">
                <span className="user-greeting">Olá, {user.email?.split('@')[0] || 'Usuário'}</span>
                <button onClick={handleLogout} className="btn logout-btn">Sair</button>
            </div>
        </nav>
    );
}

export default Navbar;
