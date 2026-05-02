import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

import Swal from 'sweetalert2';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, players } = useContext(AppContext);
    const navigate = useNavigate();

    // Encontrar o jogador #1 para o placeholder
    const getTopPlayer = () => {
        if (!players || players.length === 0) return 'Ministro';
        const sorted = [...players].sort((a, b) => b.vitorias - a.vitorias);
        return sorted[0]?.name || 'Ministro';
    };

    const topPlayer = getTopPlayer();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(username, password);
        if (success) {
            const nome = username.split('@')[0];

            Swal.fire({
                title: 'Acesso Confirmado!',
                text: `Bem-vindo de volta, ${nome}!`,
                icon: 'success',
                background: '#0a0e14',
                color: '#f0e6d2',
                confirmButtonColor: '#c89b3c',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                navigate('/');
            });
        } else {
            setError('E-mail ou senha incorretos.');
        }
    };

    return (
        <div className="login-container fade-in">
            <div className="login-box glass-panel">
                <div className="logo-glow"></div>
                <h1 className="login-title">LEAGUE <span>OF</span> LEGENDS</h1>
                <p className="subtitle">Ranking Competitivo</p>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-msg">{error}</div>}
                    <div className="input-group">
                        <label>Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={`Ex: ${topPlayer}`}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha (ex: senha)"
                            required
                        />
                    </div>
                    <button type="submit" className="btn sortear-btn login-btn">Entrar no Sistema</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
