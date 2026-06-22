import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { calculateTeamSynergies } from '../utils/season';

function History() {
    const { history, players, currentSeason } = useContext(AppContext);
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
                                <th>Registrado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map(match => {
                                const winnerSynergies = calculateTeamSynergies(history, match.winners, match.season || 'Season 1');
                                const loserSynergies = calculateTeamSynergies(history, match.losers, match.season || 'Season 1');
                                
                                return (
                                    <tr key={match.id}>
                                        <td>{match.date}</td>
                                        <td className="winrate-high">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontWeight: '600' }}>{match.winners.join(', ')}</span>
                                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {match.pontosGanhos && <span className="pdl-badge gain">+{match.pontosGanhos} PDL</span>}
                                                    {winnerSynergies.map((s, idx) => (
                                                        <span key={idx} className={`synergy-tag ${s.type}`} title={`Taxa de vitória: ${s.wr.toFixed(0)}%`}>
                                                            {s.type === 'good' ? '🔥' : '❄️'} {s.p1} + {s.p2}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="winrate-low">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontWeight: '600' }}>{match.losers.join(', ')}</span>
                                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {match.pontosPerdidos && <span className="pdl-badge loss">-{match.pontosPerdidos} PDL</span>}
                                                    {loserSynergies.map((s, idx) => (
                                                        <span key={idx} className={`synergy-tag ${s.type}`} title={`Taxa de vitória: ${s.wr.toFixed(0)}%`}>
                                                            {s.type === 'good' ? '🔥' : '❄️'} {s.p1} + {s.p2}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)' }}>
                                                👤 {match.createdBy || 'Sistema'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default History;
