import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

import Swal from 'sweetalert2';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user } = useContext(AppContext);
    const navigate = useNavigate();

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
                        <label>E-mail da sua Conta Firebase</label>
                        <input 
                            type="email" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Senha</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha..."
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
