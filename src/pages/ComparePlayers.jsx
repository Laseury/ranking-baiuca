import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getPlayersForSeason, calculateAchievements } from '../utils/season';
import Streak from '../components/Streak';
import { Link } from 'react-router-dom';

function ComparePlayers() {
    const { players, history, currentSeason } = useContext(AppContext);

    const [playerAName, setPlayerAName] = useState('');
    const [playerBName, setPlayerBName] = useState('');

    useEffect(() => {
        if (players.length >= 2 && (!playerAName || !playerBName)) {
            setPlayerAName(players[0].name);
            setPlayerBName(players[1].name);
        }
    }, [players, playerAName, playerBName]);

    const seasonPlayers = useMemo(() => {
        return getPlayersForSeason(players, history, currentSeason, currentSeason);
    }, [players, history, currentSeason]);

    const playerA = useMemo(() => seasonPlayers.find(p => p.name === playerAName), [seasonPlayers, playerAName]);
    const playerB = useMemo(() => seasonPlayers.find(p => p.name === playerBName), [seasonPlayers, playerBName]);

    const badgesA = useMemo(() => playerA ? calculateAchievements(playerA, seasonPlayers, history, currentSeason) : [], [playerA, seasonPlayers, history, currentSeason]);
    const badgesB = useMemo(() => playerB ? calculateAchievements(playerB, seasonPlayers, history, currentSeason) : [], [playerB, seasonPlayers, history, currentSeason]);

    // Extended H2H and shared match stats
    const h2hStats = useMemo(() => {
        if (!playerAName || !playerBName || playerAName === playerBName) return null;

        const seasonMatches = history.filter(m =>
            m.season === currentSeason || (!m.season && currentSeason === 'Season 1')
        );

        let winsA_againstB = 0;
        let winsB_againstA = 0;
        let playedTogetherWins = 0;
        let playedTogetherLosses = 0;
        const sharedMatches = [];

        seasonMatches.forEach(match => {
            const hasA_win = match.winners.includes(playerAName);
            const hasA_loss = match.losers.includes(playerAName);
            const hasB_win = match.winners.includes(playerBName);
            const hasB_loss = match.losers.includes(playerBName);

            if (hasA_win && hasB_loss) {
                winsA_againstB++;
                sharedMatches.push({ ...match, type: 'A_beat_B' });
            } else if (hasB_win && hasA_loss) {
                winsB_againstA++;
                sharedMatches.push({ ...match, type: 'B_beat_A' });
            } else if (hasA_win && hasB_win) {
                playedTogetherWins++;
                sharedMatches.push({ ...match, type: 'together_win' });
            } else if (hasA_loss && hasB_loss) {
                playedTogetherLosses++;
                sharedMatches.push({ ...match, type: 'together_loss' });
            }
        });

        const totalAgainst = winsA_againstB + winsB_againstA;
        const totalWith = playedTogetherWins + playedTogetherLosses;

        // Calculate max streaks
        const calcMaxStreak = (pName, matchList) => {
            const sorted = [...matchList].sort((a, b) => a.timestamp - b.timestamp);
            let maxW = 0, maxL = 0, cW = 0, cL = 0;
            sorted.forEach(m => {
                if (m.winners.includes(pName)) { cW++; cL = 0; maxW = Math.max(maxW, cW); }
                else if (m.losers.includes(pName)) { cL++; cW = 0; maxL = Math.max(maxL, cL); }
            });
            return { maxW, maxL };
        };

        const ratingHistoryA = playerA?.ratingHistory || [1000];
        const ratingHistoryB = playerB?.ratingHistory || [1000];
        const peakA = Math.max(...ratingHistoryA);
        const peakB = Math.max(...ratingHistoryB);

        const allPlayerMatches = seasonMatches.filter(m => m.winners.includes(playerAName) || m.losers.includes(playerAName));
        const allPlayerMatchesB = seasonMatches.filter(m => m.winners.includes(playerBName) || m.losers.includes(playerBName));
        const streaksA = calcMaxStreak(playerAName, allPlayerMatches);
        const streaksB = calcMaxStreak(playerBName, allPlayerMatchesB);

        // Sorted shared matches (most recent 5)
        const recentShared = [...sharedMatches].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        // Diagnosis: who wins each category
        const diagCategories = [
            { label: 'PDL', valA: playerA?.pontos || 0, valB: playerB?.pontos || 0, unit: ' PDL', icon: '📊' },
            { label: 'Winrate', valA: playerA?.winrate || 0, valB: playerB?.winrate || 0, unit: '%', icon: '🏆' },
            { label: 'Vitórias', valA: playerA?.vitorias || 0, valB: playerB?.vitorias || 0, unit: 'W', icon: '✅' },
            { label: 'PDL de Pico', valA: peakA, valB: peakB, unit: ' PDL', icon: '🔝' },
            { label: 'Maior Seq. W', valA: streaksA.maxW, valB: streaksB.maxW, unit: 'W', icon: '⚡' },
        ];
        const aWins = diagCategories.filter(c => c.valA > c.valB).length;
        const bWins = diagCategories.filter(c => c.valB > c.valA).length;

        return {
            winsA_againstB,
            winsB_againstA,
            totalAgainst,
            playedTogetherWins,
            playedTogetherLosses,
            totalWith,
            recentShared,
            diagCategories,
            aWins,
            bWins,
            streaksA,
            streaksB,
            peakA,
            peakB,
        };
    }, [history, currentSeason, playerAName, playerBName, playerA, playerB]);

    const renderCompareBar = (label, icon, valA, valB, format = (v) => v) => {
        const sum = valA + valB;
        const pctA = sum > 0 ? (valA / sum) * 100 : 50;
        const pctB = sum > 0 ? (valB / sum) * 100 : 50;

        return (
            <div className="compare-bar-item" style={{ marginBottom: '1.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', alignItems: 'center' }}>
                    <span style={{ color: '#00d2ff', minWidth: '80px' }}>{format(valA)}</span>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>{icon} {label}</span>
                    <span style={{ color: '#ff00ea', minWidth: '80px', textAlign: 'right' }}>{format(valB)}</span>
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

            {/* ─── SELETORES ─── */}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {/* ─── HEADER CARDS ─── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {/* Player A */}
                        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #00d2ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                            <div className="profile-avatar" style={{ border: '3px solid #00d2ff', boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)', background: 'rgba(0, 210, 255, 0.1)' }}>
                                {playerA.elo?.icon || '⚙️'}
                            </div>
                            <h2 style={{ color: '#ffffff', margin: 0 }}>{playerA.name}</h2>
                            <span className={`elo-badge ${playerA.elo?.class || 'elo-iron'}`}>{playerA.elo?.name || 'Ferro'}</span>
                            <h4 style={{ color: '#00d2ff', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{playerA.pontos} PDL</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center', maxWidth: '220px' }}>
                                {badgesA.map(b => (
                                    <span key={b.id} title={`${b.name}: ${b.desc}`} style={{ fontSize: '1.3rem', cursor: 'help' }}>{b.icon}</span>
                                ))}
                                {badgesA.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem títulos ainda</span>}
                            </div>
                            <div style={{ marginTop: '0.2rem' }}>
                                <Streak history={playerA.streak} />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--win-color)' }}>{playerA.vitorias}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VITÓRIAS</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--loss-color)' }}>{playerA.derrotas}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DERROTAS</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{playerA.winrate}%</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WINRATE</div>
                                </div>
                            </div>
                        </div>

                        {/* Player B */}
                        <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #ff00ea', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                            <div className="profile-avatar" style={{ border: '3px solid #ff00ea', boxShadow: '0 0 20px rgba(255, 0, 234, 0.3)', background: 'rgba(255, 0, 234, 0.1)' }}>
                                {playerB.elo?.icon || '⚙️'}
                            </div>
                            <h2 style={{ color: '#ffffff', margin: 0 }}>{playerB.name}</h2>
                            <span className={`elo-badge ${playerB.elo?.class || 'elo-iron'}`}>{playerB.elo?.name || 'Ferro'}</span>
                            <h4 style={{ color: '#ff00ea', fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{playerB.pontos} PDL</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center', maxWidth: '220px' }}>
                                {badgesB.map(b => (
                                    <span key={b.id} title={`${b.name}: ${b.desc}`} style={{ fontSize: '1.3rem', cursor: 'help' }}>{b.icon}</span>
                                ))}
                                {badgesB.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem títulos ainda</span>}
                            </div>
                            <div style={{ marginTop: '0.2rem' }}>
                                <Streak history={playerB.streak} />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--win-color)' }}>{playerB.vitorias}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VITÓRIAS</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--loss-color)' }}>{playerB.derrotas}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DERROTAS</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{playerB.winrate}%</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WINRATE</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── MÉTRICAS COMPARATIVAS ─── */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ color: 'var(--primary-color)', marginBottom: '2rem', textAlign: 'center' }}>📊 Métricas Comparativas</h3>
                        {renderCompareBar('Pontos (PDL)', '📈', playerA.pontos, playerB.pontos, (v) => `${v} PDL`)}
                        {renderCompareBar('Taxa de Vitória', '🏆', playerA.winrate, playerB.winrate, (v) => `${v}%`)}
                        {renderCompareBar('Vitórias', '✅', playerA.vitorias, playerB.vitorias)}
                        {renderCompareBar('Derrotas', '💀', playerA.derrotas, playerB.derrotas)}
                        {renderCompareBar('Total de Partidas', '⚔️', playerA.total, playerB.total)}
                        {h2hStats && renderCompareBar('PDL de Pico', '🔝', h2hStats.peakA, h2hStats.peakB, (v) => `${v} PDL`)}
                        {h2hStats && renderCompareBar('Melhor Seq. de W', '⚡', h2hStats.streaksA.maxW, h2hStats.streaksB.maxW, (v) => `${v}W`)}
                    </div>

                    {/* ─── DIAGNÓSTICO DE CONFRONTO ─── */}
                    {h2hStats && (
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', textAlign: 'center' }}>🔬 Diagnóstico de Confronto</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '2rem' }}>
                                {h2hStats.diagCategories.map(cat => {
                                    const aWin = cat.valA > cat.valB;
                                    const bWin = cat.valB > cat.valA;
                                    const tie = cat.valA === cat.valB;
                                    return (
                                        <div key={cat.label} style={{ padding: '1rem', borderRadius: '10px', background: tie ? 'rgba(255,255,255,0.04)' : aWin ? 'rgba(0,210,255,0.07)' : 'rgba(255,0,234,0.07)', border: `1px solid ${tie ? 'rgba(255,255,255,0.08)' : aWin ? 'rgba(0,210,255,0.2)' : 'rgba(255,0,234,0.2)'}`, textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{cat.icon}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{cat.label}</div>
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <span style={{ color: aWin ? '#00d2ff' : 'var(--text-muted)', fontWeight: aWin ? 900 : 400 }}>{cat.valA}{cat.unit}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>vs</span>
                                                <span style={{ color: bWin ? '#ff00ea' : 'var(--text-muted)', fontWeight: bWin ? 900 : 400 }}>{cat.valB}{cat.unit}</span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: tie ? 'var(--text-muted)' : aWin ? '#00d2ff' : '#ff00ea' }}>
                                                {tie ? '⚖️ Empate' : aWin ? `${playerAName} vence` : `${playerBName} vence`}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Veredito final */}
                            <div style={{ textAlign: 'center', padding: '1.2rem', borderRadius: '12px', background: h2hStats.aWins > h2hStats.bWins ? 'rgba(0,210,255,0.1)' : h2hStats.bWins > h2hStats.aWins ? 'rgba(255,0,234,0.1)' : 'rgba(255,255,255,0.05)', border: `2px solid ${h2hStats.aWins > h2hStats.bWins ? '#00d2ff' : h2hStats.bWins > h2hStats.aWins ? '#ff00ea' : 'rgba(255,255,255,0.1)'}` }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                                    {h2hStats.aWins > h2hStats.bWins ? '🔵' : h2hStats.bWins > h2hStats.aWins ? '🟣' : '⚖️'}
                                </div>
                                <div style={{ fontWeight: 900, fontSize: '1rem' }}>
                                    {h2hStats.aWins === h2hStats.bWins
                                        ? 'Ambos são perfeitamente equilibrados!'
                                        : `${h2hStats.aWins > h2hStats.bWins ? playerAName : playerBName} leva vantagem em ${Math.max(h2hStats.aWins, h2hStats.bWins)} de ${h2hStats.diagCategories.length} categorias`
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── H2H + JUNTOS ─── */}
                    {h2hStats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                            {/* Confronto Direto */}
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

                            {/* Jogando Juntos */}
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

                    {/* ─── HISTÓRICO EM COMUM ─── */}
                    {h2hStats && h2hStats.recentShared.length > 0 && (
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>📜 Últimas Partidas em Comum</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {h2hStats.recentShared.map(match => {
                                    const isTogetherWin = match.type === 'together_win';
                                    const isTogetherLoss = match.type === 'together_loss';
                                    const aBeatB = match.type === 'A_beat_B';
                                    const bBeatA = match.type === 'B_beat_A';

                                    let label = '';
                                    let labelColor = 'var(--text-muted)';
                                    if (isTogetherWin) { label = '🤝 Juntos → VITÓRIA'; labelColor = 'var(--win-color)'; }
                                    if (isTogetherLoss) { label = '🤝 Juntos → DERROTA'; labelColor = 'var(--loss-color)'; }
                                    if (aBeatB) { label = `⚔️ ${playerAName} venceu ${playerBName}`; labelColor = '#00d2ff'; }
                                    if (bBeatA) { label = `⚔️ ${playerBName} venceu ${playerAName}`; labelColor = '#ff00ea'; }

                                    return (
                                        <div key={match.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.2rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.8rem' }}>{match.date?.split(' ')[0] || '—'}</span>
                                                <span style={{ fontWeight: 700, color: labelColor }}>{label}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {match.winners?.join(', ')} <span style={{ margin: '0 0.4rem' }}>vs</span> {match.losers?.join(', ')}
                                            </div>
                                        </div>
                                    );
                                })}
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
