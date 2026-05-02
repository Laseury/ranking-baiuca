import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

function NewPlayer() {
    const [name, setName] = useState('');
    const [success, setSuccess] = useState(false);
    const { addPlayer } = useContext(AppContext);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            addPlayer(name.trim());
            setSuccess(true);
            setName('');
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    return (
        <div className="fade-in">
            <div className="history-header">
                <div>
                    <h1>👤 Novo Jogador</h1>
                    <p className="subtitle" style={{ textAlign: 'left', margin: 0 }}>Cadastre um novo participante no sistema.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} className="login-form" style={{ marginTop: 0 }}>
                    {success && <div style={{ background: 'var(--win-bg)', color: 'var(--win-color)', padding: '0.8rem', borderRadius: '6px', textAlign: 'center', fontWeight: '600' }}>Jogador cadastrado com sucesso!</div>}
                    <div className="input-group">
                        <label>Nome do Jogador</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Digite o nome ou nick..."
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn sortear-btn" style={{ flex: 1, margin: 0, justifyContent: 'center' }}>Cadastrar</button>
                        <button type="button" className="btn cancel-btn" style={{ flex: 1 }} onClick={() => navigate('/matchmaker')}>Ir para Sorteio</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewPlayer;
