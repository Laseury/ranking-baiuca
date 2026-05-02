import React, { useContext, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { getElo } from '../utils/elo';
import Streak from '../components/Streak';

function PlayerProfile() {
    const { name } = useParams();
    const { players, history } = useContext(AppContext);

    const player = useMemo(() => players.find(p => p.name === name), [players, name]);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    const stats = useMemo(() => {
        if (!player) return null;

        const playerHistory = history.filter(h => h.winners.includes(name) || h.losers.includes(name));
        const winrate = playerHistory.length > 0 ? (history.filter(h => h.winners.includes(name)).length / playerHistory.length * 100).toFixed(1) : 0;
        
        // Calcular Aliados e Rivais
        const allies = {};
        const rivals = {};

        playerHistory.forEach(match => {
            const isWinner = match.winners.includes(name);
            if (isWinner) {
                match.winners.forEach(p => {
                    if (p !== name) allies[p] = (allies[p] || 0) + 1;
                });
            } else {
                match.winners.forEach(p => {
                    rivals[p] = (rivals[p] || 0) + 1;
                });
            }
        });

        const sortedAllies = Object.entries(allies).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const sortedRivals = Object.entries(rivals).sort((a, b) => b[1] - a[1]).slice(0, 3);

        return {
            history: playerHistory,
            winrate,
            allies: sortedAllies,
            rivals: sortedRivals,
            elo: getElo(player.rating || (1000 + (player.vitorias - player.derrotas) * 20))
        };
    }, [player, history, name]);

    if (!player) return <div className="container">Jogador não encontrado.</div>;

    return (
        <div className="fade-in container">
            <div className="profile-header glass-panel">
                <div className="profile-avatar">{stats.elo.icon}</div>
                <div className="profile-main-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1>{player.name}</h1>
                    <span className={`elo-badge ${stats.elo.class}`} style={{ fontSize: '1rem' }}>
                        {stats.elo.name}
                    </span>
                    <p className="subtitle" style={{ marginTop: '0.5rem', width: '100%', textAlign: 'center' }}>
                        {player.rating || (1000 + (player.vitorias - player.derrotas) * 20)} PDL
                    </p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass-panel">
                    <h5>Taxa de Vitória</h5>
                    <div className="value" style={{ color: parseFloat(stats.winrate) >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>
                        {stats.winrate}%
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <h5>Partidas Totais</h5>
                    <div className="value">{player.total}</div>
                </div>
                <div className="stat-card glass-panel">
                    <h5>Vitórias / Derrotas</h5>
                    <div className="value" style={{ fontSize: '1.5rem' }}>
                        <span style={{ color: 'var(--win-color)' }}>{player.vitorias}W</span> / <span style={{ color: 'var(--loss-color)' }}>{player.derrotas}L</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <h5>Sequência Recente</h5>
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                        <Streak history={player.streak} />
                    </div>
                </div>
            </div>

            <div className="social-stats">
                <div className="social-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h4>🤝 Melhores Aliados</h4>
                    <div className="social-list">
                        {stats.allies.length > 0 ? stats.allies.map(([name, count]) => (
                            <div key={name} className="social-item">
                                <span>{name}</span>
                                <span className="badge" style={{ background: 'var(--win-bg)', color: 'var(--win-color)' }}>{count} vitórias juntos</span>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)' }}>Nenhum aliado frequente ainda.</p>}
                    </div>
                </div>
                <div className="social-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h4>⚔️ Maiores Rivais</h4>
                    <div className="social-list">
                        {stats.rivals.length > 0 ? stats.rivals.map(([name, count]) => (
                            <div key={name} className="social-item">
                                <span>{name}</span>
                                <span className="badge" style={{ background: 'var(--loss-bg)', color: 'var(--loss-color)' }}>{count} derrotas para ele</span>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)' }}>Nenhum rival frequente ainda.</p>}
                    </div>
                </div>
            </div>

            <section className="ranking-section">
                <div className="section-header" style={{ justifyContent: 'space-between' }}>
                    <h2>📜 Histórico Pessoal</h2>
                    <button 
                        className="btn secondary-btn" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => setIsMobileView(!isMobileView)}
                    >
                        {isMobileView ? 'Ver Modo Desktop 🖥️' : 'Ver Modo Mobile 📱'}
                    </button>
                </div>
                <div className={`table-container ${isMobileView ? 'mobile-grid' : 'glass-panel'}`}>
                    {isMobileView ? (
                        <div className="player-cards-grid">
                            {stats.history.map(match => {
                                const isWinner = match.winners.includes(player.name);
                                return (
                                    <div key={match.id} className={`player-card-mobile glass-panel ${isWinner ? 'win-border' : 'loss-border'}`}>
                                        <div className="card-mobile-header">
                                            <span className="date-col">{match.date.split(' ')[0]}</span>
                                            <span className={isWinner ? 'winrate-high' : 'winrate-low'} style={{ fontWeight: '800' }}>
                                                {isWinner ? 'VITÓRIA' : 'DERROTA'}
                                            </span>
                                            <span className={isWinner ? 'winrate-high' : 'winrate-low'} style={{ marginLeft: 'auto' }}>
                                                {isWinner ? `+${match.pontosGanhos || 20}` : `-${match.pontosPerdidos || 20}`} PDL
                                            </span>
                                        </div>
                                        <div className="card-mobile-stats">
                                            <div className="stat-item">
                                                <span className="label">ALIADOS</span>
                                                <span className="value">{isWinner ? match.winners.filter(n => n !== player.name).join(', ') : match.losers.filter(n => n !== player.name).join(', ')}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="label">OPONENTES</span>
                                                <span className="value">{isWinner ? match.losers.join(', ') : match.winners.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Resultado</th>
                                    <th>Aliados</th>
                                    <th>Oponentes</th>
                                    <th>Pontos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.history.map(match => {
                                    const isWinner = match.winners.includes(player.name);
                                    return (
                                        <tr key={match.id} className="player-row" style={{ opacity: 1, animation: 'none' }}>
                                            <td>{match.date.split(' ')[0]}</td>
                                            <td className={isWinner ? 'winrate-high' : 'winrate-low'}>
                                                {isWinner ? 'VITÓRIA' : 'DERROTA'}
                                            </td>
                                            <td>{isWinner ? match.winners.filter(n => n !== player.name).join(', ') : match.losers.filter(n => n !== player.name).join(', ')}</td>
                                            <td>{isWinner ? match.losers.join(', ') : match.winners.join(', ')}</td>
                                            <td className={isWinner ? 'winrate-high' : 'winrate-low'}>
                                                {isWinner ? `+${match.pontosGanhos || 20}` : `-${match.pontosPerdidos || 20}`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}

export default PlayerProfile;
