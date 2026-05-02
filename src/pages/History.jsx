import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

function History() {
    const { history, players } = useContext(AppContext);
    const [dateFilter, setDateFilter] = useState('');
    const [playerFilter, setPlayerFilter] = useState('');
    const navigate = useNavigate();

    const filteredHistory = history.filter(match => {
        const matchDate = dateFilter ? match.date === dateFilter : true;
        const matchPlayer = playerFilter ? (match.winners.includes(playerFilter) || match.losers.includes(playerFilter)) : true;
        return matchDate && matchPlayer;
    });

    return (
        <div className="fade-in">
            <div className="history-header">
                <div>
                    <h1>📜 Histórico de Partidas</h1>
                    <p className="subtitle" style={{ textAlign: 'left', margin: 0 }}>Acompanhe os resultados e gerencie o histórico.</p>
                </div>
                <button className="btn win-btn" style={{ width: 'auto' }} onClick={() => navigate('/matchmaker')}>Nova Partida</button>
            </div>

            <div className="filters-container glass-panel">
                <div className="input-group">
                    <label>DATA</label>
                    <input 
                        type="text" 
                        placeholder="dd/mm/aaaa" 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)} 
                    />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                    <label>JOGADOR</label>
                    <select 
                        value={playerFilter} 
                        onChange={(e) => setPlayerFilter(e.target.value)}
                    >
                        <option value="">Todos os jogadores</option>
                        {players.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container glass-panel" style={{ marginTop: '2rem' }}>
                {filteredHistory.length === 0 ? (
                    <div className="empty-state">Nenhuma partida encontrada com estes filtros.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Time Vencedor</th>
                                <th>Time Perdedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map(match => (
                                <tr key={match.id}>
                                    <td>{match.date}</td>
                                    <td className="winrate-high">{match.winners.join(', ')}</td>
                                    <td className="winrate-low">{match.losers.join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default History;
