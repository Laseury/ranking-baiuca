import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

function Navbar() {
    const { user, logout, region, changeRegion } = useContext(AppContext);
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
            <div className="nav-user" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="region-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Região:</span>
                    <select 
                        value={region} 
                        onChange={(e) => changeRegion(e.target.value)}
                        style={{
                            background: 'rgba(0,0,0,0.4)',
                            color: 'var(--primary-color)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none',
                            fontFamily: 'Outfit, sans-serif'
                        }}
                    >
                        <option value="default">Original</option>
                        <option value="demacia">Demacia ☀️</option>
                        <option value="noxus">Noxus ⚔️</option>
                        <option value="ionia">Ionia 🌸</option>
                        <option value="freljord">Freljord ❄️</option>
                        <option value="shadow-isles">Ilhas das Sombras 👻</option>
                        <option value="shurima">Shurima ⏳</option>
                    </select>
                </div>
                <span className="user-greeting" style={{ marginRight: '1rem' }}>Olá, {user.email?.split('@')[0] || 'Usuário'}</span>
                <button onClick={handleLogout} className="btn logout-btn">Sair</button>
            </div>
        </nav>
    );
}

export default Navbar;
