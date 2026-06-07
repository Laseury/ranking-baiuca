import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getPlayersForSeason } from '../utils/season';
import Streak from '../components/Streak';

function ComparePlayers() {
    const { players, history, currentSeason } = useContext(AppContext);
    
    // Default to the first two players in the list if available
    const [playerAName, setPlayerAName] = useState('');
    const [playerBName, setPlayerBName] = useState('');
    
    // Sync default selections when players load
    useEffect(() => {
        if (players.length >= 2 && (!playerAName || !playerBName)) {
            setPlayerAName(players[0].name);
            setPlayerBName(players[1].name);
        }
    }, [players, playerAName, playerBName]);

    // Recalculate player stats for the current season
    const seasonPlayers = useMemo(() => {
        return getPlayersForSeason(players, history, currentSeason, currentSeason);
    }, [players, history, currentSeason]);

    const playerA = useMemo(() => seasonPlayers.find(p => p.name === playerAName), [seasonPlayers, playerAName]);
    const playerB = useMemo(() => seasonPlayers.find(p => p.name === playerBName), [seasonPlayers, playerBName]);

    // Calculate Head-to-Head stats
    const h2hStats = useMemo(() => {
        if (!playerAName || !playerBName || playerAName === playerBName) return null;

        const seasonMatches = history.filter(m => 
            m.season === currentSeason || (!m.season && currentSeason === 'Season 1')
        );

        let winsA_againstB = 0;
        let winsB_againstA = 0;
        let playedTogetherWins = 0;
        let playedTogetherLosses = 0;

        seasonMatches.forEach(match => {
            const hasA_win = match.winners.includes(playerAName);
            const hasA_loss = match.losers.includes(playerAName);
            const hasB_win = match.winners.includes(playerBName);
            const hasB_loss = match.losers.includes(playerBName);

            // Played against each other
            if (hasA_win && hasB_loss) {
                winsA_againstB++;
            } else if (hasB_win && hasA_loss) {
                winsB_againstA++;
            }
            
            // Played together as allies
            if (hasA_win && hasB_win) {
                playedTogetherWins++;
            } else if (hasA_loss && hasB_loss) {
                playedTogetherLosses++;
            }
        });

        const totalAgainst = winsA_againstB + winsB_againstA;
        const totalWith = playedTogetherWins + playedTogetherLosses;

        return {
            winsA_againstB,
            winsB_againstA,
            totalAgainst,
            playedTogetherWins,
            playedTogetherLosses,
            totalWith
        };
    }, [history, currentSeason, playerAName, playerBName]);

    // Custom proportional bar generator
    const renderCompareBar = (label, valA, valB, format = (v) => v) => {
        const sum = valA + valB;
        const pctA = sum > 0 ? (valA / sum) * 100 : 50;
        const pctB = sum > 0 ? (valB / sum) * 100 : 50;
        
        return (
            <div className="compare-bar-item" style={{ marginBottom: '1.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <span style={{ color: '#00d2ff' }}>{format(valA)}</span>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>{label}</span>
                    <span style={{ color: '#ff00ea' }}>{format(valB)}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pctA}%`, background: 'linear-gradient(to right, #0099ff, #00d2ff)', height: '100%', transition: 'width 0.5s ease-in-out' }} />
                    <div style={{ width: `${pctB}%`, background: 'linear-gradient(to right, #ff00ea, #b43ca8)', height: '100%', transition: 'width 0.5s ease-in-out' }} />
                </div>
            </div>
        );
    };

    return (
        <div className="fade-in">
            <header>
                <h1>COMPARAÇÃO <span>DIRETA</span></h1>
                <p className="subtitle">Selecione dois jogadores para comparar suas estatísticas</p>
            </header>

            <div className="compare-selectors glass-panel" style={{ display: 'flex', gap: '2rem', padding: '2rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ color: '#00d2ff', fontWeight: 'bold' }}>JOGADOR A (AZUL)</label>
                    <select value={playerAName} onChange={(e) => setPlayerAName(e.target.value)}>
                        {seasonPlayers.map(p => (
                            <option key={p.id} value={p.name} disabled={p.name === playerBName}>{p.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="vs-badge" style={{ fontSize: '1.5rem', alignSelf: 'flex-end', marginBottom: '0.5rem' }}>VS</div>

                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ color: '#ff00ea', fontWeight: 'bold' }}>JOGADOR B (ROSA)</label>
                    <select value={playerBName} onChange={(e) => setPlayerBName(e.target.value)}>
                        {seasonPlayers.map(p => (
                            <option key={p.id} value={p.name} disabled={p.name === playerAName}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {playerA && playerB ? (
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {/* Header Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {/* Player A Card */}
                        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #00d2ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                            <div className="profile-avatar" style={{ border: '3px solid #00d2ff', boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)', background: 'rgba(0, 210, 255, 0.1)' }}>
                                {playerA.elo?.icon || '⚙️'}
                            </div>
                            <h2 style={{ color: '#ffffff' }}>{playerA.name}</h2>
                            <span className={`elo-badge ${playerA.elo?.class || 'elo-iron'}`}>{playerA.elo?.name || 'Ferro'}</span>
                            <h4 style={{ color: '#00d2ff', fontSize: '1.5rem', fontWeight: '800' }}>{playerA.pontos} PDL</h4>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Streak history={playerA.streak} />
                            </div>
                        </div>

                        {/* Player B Card */}
                        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #ff00ea', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                            <div className="profile-avatar" style={{ border: '3px solid #ff00ea', boxShadow: '0 0 20px rgba(255, 0, 234, 0.3)', background: 'rgba(255, 0, 234, 0.1)' }}>
                                {playerB.elo?.icon || '⚙️'}
                            </div>
                            <h2 style={{ color: '#ffffff' }}>{playerB.name}</h2>
                            <span className={`elo-badge ${playerB.elo?.class || 'elo-iron'}`}>{playerB.elo?.name || 'Ferro'}</span>
                            <h4 style={{ color: '#ff00ea', fontSize: '1.5rem', fontWeight: '800' }}>{playerB.pontos} PDL</h4>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Streak history={playerB.streak} />
                            </div>
                        </div>
                    </div>

                    {/* Proportional Bars Section */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ color: 'var(--primary-color)', marginBottom: '2rem', textAlign: 'center' }}>📊 Métricas Comparativas</h3>
                        {renderCompareBar('Pontos (PDL)', playerA.pontos, playerB.pontos, (v) => `${v} PDL`)}
                        {renderCompareBar('Taxa de Vitória', playerA.winrate, playerB.winrate, (v) => `${v}%`)}
                        {renderCompareBar('Vitórias', playerA.vitorias, playerB.vitorias)}
                        {renderCompareBar('Total de Partidas', playerA.total, playerB.total)}
                    </div>

                    {/* Head-to-Head Section */}
                    {h2hStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                            {/* Confronto Direto Card */}
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>⚔️ Confrontos Diretos</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Partidas em times opostos nesta temporada</p>
                                
                                {h2hStats.totalAgainst > 0 ? (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                                            <div>
                                                <h4 style={{ fontSize: '2.5rem', color: '#00d2ff', fontWeight: '900' }}>{h2hStats.winsA_againstB}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{playerA.name}</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-muted)' }}>-</div>
                                            <div>
                                                <h4 style={{ fontSize: '2.5rem', color: '#ff00ea', fontWeight: '900' }}>{h2hStats.winsB_againstA}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{playerB.name}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                                            {h2hStats.winsA_againstB === h2hStats.winsB_againstA ? (
                                                <span style={{ color: 'var(--text-muted)' }}>Empatados em confrontos! ⚖️</span>
                                            ) : h2hStats.winsA_againstB > h2hStats.winsB_againstA ? (
                                                <span style={{ color: '#00d2ff' }}>{playerA.name} tem a vantagem! 👑</span>
                                            ) : (
                                                <span style={{ color: '#ff00ea' }}>{playerB.name} tem a vantagem! 👑</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Eles ainda não se enfrentaram em times opostos.</div>
                                )}
                            </div>

                            {/* Parceiros / Aliados Card */}
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                                <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>🤝 Jogando Juntos</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Partidas no mesmo time nesta temporada</p>
                                
                                {h2hStats.totalWith > 0 ? (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                                            <div>
                                                <h4 style={{ fontSize: '2.5rem', color: 'var(--win-color)', fontWeight: '900' }}>{h2hStats.playedTogetherWins}W</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vitórias</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-muted)' }}>/</div>
                                            <div>
                                                <h4 style={{ fontSize: '2.5rem', color: 'var(--loss-color)', fontWeight: '900' }}>{h2hStats.playedTogetherLosses}L</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Derrotas</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                                            Taxa de vitória juntos:{' '}
                                            <span style={{ color: 'var(--primary-color)' }}>
                                                {((h2hStats.playedTogetherWins / h2hStats.totalWith) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Eles ainda não jogaram no mesmo time.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Selecione dois jogadores para iniciar a análise comparativa.
                </div>
            )}
        </div>
    );
}

export default ComparePlayers;
