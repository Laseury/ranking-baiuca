import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { getElo } from '../utils/elo';
import Streak from '../components/Streak';
import { getPlayersForSeason, getSeasonOptions, calculateAchievements, calculateTeamSynergies } from '../utils/season';
import PDLChart from '../components/PDLChart';

// Helper component: Stat Card
function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className="stat-card glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem', opacity: 0.15 }}>{icon}</div>
            <h5>{label}</h5>
            <div className="value" style={{ color: color || 'var(--text-main)' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub}</div>}
        </div>
    );
}

function PlayerProfile() {
    const { name } = useParams();
    const { players, history, currentSeason } = useContext(AppContext);

    const [selectedSeason, setSelectedSeason] = useState("Season 1");
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        if (currentSeason) {
            setSelectedSeason(currentSeason);
        }
    }, [currentSeason]);

    const seasonPlayers = useMemo(() => {
        return getPlayersForSeason(players, history, selectedSeason, currentSeason);
    }, [players, history, selectedSeason, currentSeason]);

    const player = useMemo(() => seasonPlayers.find(p => p.name === name), [seasonPlayers, name]);

    const badges = useMemo(() => {
        if (!player) return [];
        return calculateAchievements(player, seasonPlayers, history, selectedSeason);
    }, [player, seasonPlayers, history, selectedSeason]);

    const stats = useMemo(() => {
        if (!player) return null;

        const seasonMatches = history.filter(m =>
            m.season === selectedSeason || (!m.season && selectedSeason === 'Season 1')
        );

        const playerHistory = seasonMatches.filter(h => h.winners.includes(name) || h.losers.includes(name));
        const winrate = playerHistory.length > 0 ? (playerHistory.filter(h => h.winners.includes(name)).length / playerHistory.length * 100).toFixed(1) : 0;

        // Adversário mais derrotado & kriptonita
        const winsVsMap = {};
        const lossesVsMap = {};
        playerHistory.forEach(match => {
            const isWinner = match.winners.includes(name);
            if (isWinner) {
                match.losers.forEach(p => { winsVsMap[p] = (winsVsMap[p] || 0) + 1; });
            } else {
                match.winners.forEach(p => { lossesVsMap[p] = (lossesVsMap[p] || 0) + 1; });
            }
        });
        const mostDefeated = Object.entries(winsVsMap).sort((a, b) => b[1] - a[1])[0] || null;
        const kryptonite = Object.entries(lossesVsMap).sort((a, b) => b[1] - a[1])[0] || null;

        // Aliados & Rivais
        const allies = {};
        const rivals = {};
        playerHistory.forEach(match => {
            const isWinner = match.winners.includes(name);
            if (isWinner) {
                match.winners.forEach(p => { if (p !== name) allies[p] = (allies[p] || 0) + 1; });
            } else {
                match.winners.forEach(p => { rivals[p] = (rivals[p] || 0) + 1; });
            }
        });
        const sortedAllies = Object.entries(allies).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const sortedRivals = Object.entries(rivals).sort((a, b) => b[1] - a[1]).slice(0, 3);

        // Max & Min streak
        let maxWStreak = 0, maxLStreak = 0, curW = 0, curL = 0;
        const chronoHistory = [...playerHistory].sort((a, b) => a.timestamp - b.timestamp);
        chronoHistory.forEach(match => {
            if (match.winners.includes(name)) {
                curW++; curL = 0;
                maxWStreak = Math.max(maxWStreak, curW);
            } else {
                curL++; curW = 0;
                maxLStreak = Math.max(maxLStreak, curL);
            }
        });

        // PDL stats from rating history
        const ratingHistory = player.ratingHistory || [1000];
        const peakPDL = Math.max(...ratingHistory);
        const bottomPDL = Math.min(...ratingHistory);
        const pdlDelta = ratingHistory[ratingHistory.length - 1] - ratingHistory[0];

        // Weekly heatmap (day of week: 0=Sun ... 6=Sat)
        const daysMap = { 0: { wins: 0, losses: 0 }, 1: { wins: 0, losses: 0 }, 2: { wins: 0, losses: 0 }, 3: { wins: 0, losses: 0 }, 4: { wins: 0, losses: 0 }, 5: { wins: 0, losses: 0 }, 6: { wins: 0, losses: 0 } };
        playerHistory.forEach(match => {
            const date = match.timestamp ? new Date(match.timestamp) : null;
            if (!date) return;
            const day = date.getDay();
            if (match.winners.includes(name)) daysMap[day].wins++;
            else daysMap[day].losses++;
        });

        return {
            history: playerHistory,
            winrate,
            allies: sortedAllies,
            rivals: sortedRivals,
            mostDefeated,
            kryptonite,
            maxWStreak,
            maxLStreak,
            peakPDL,
            bottomPDL,
            pdlDelta,
            daysMap,
            elo: getElo(player.rating !== undefined ? player.rating : 1000)
        };
    }, [player, history, name, selectedSeason]);

    if (!player) return <div className="container">Jogador não encontrado.</div>;

    // Elo progress bar
    const eloTiers = [
        { name: 'Plástico', min: 0, max: 199 },
        { name: 'Papelão', min: 200, max: 399 },
        { name: 'Madeira', min: 400, max: 599 },
        { name: 'Pedra', min: 600, max: 750 },
        { name: 'Cobre', min: 751, max: 850 },
        { name: 'Ferro', min: 851, max: 950 },
        { name: 'Bronze', min: 951, max: 1050 },
        { name: 'Prata', min: 1051, max: 1150 },
        { name: 'Ouro', min: 1151, max: 1250 },
        { name: 'Platina', min: 1251, max: 1350 },
        { name: 'Esmeralda', min: 1351, max: 1450 },
        { name: 'Diamante', min: 1451, max: 1550 },
        { name: 'Rubi', min: 1551, max: 1650 },
        { name: 'Safira', min: 1651, max: 1750 },
        { name: 'Mestre', min: 1751, max: 1900 },
        { name: 'Grão-Mestre', min: 1901, max: 2100 },
        { name: 'Challenger', min: 2101, max: 2300 },
        { name: 'Radiante', min: 2301, max: 2500 },
        { name: 'Lenda', min: 2501, max: 9999 },
    ];
    const currentTier = eloTiers.find(t => t.name === stats.elo.name) || eloTiers[0];
    const nextTier = eloTiers[eloTiers.indexOf(currentTier) + 1];
    const eloProgress = nextTier
        ? Math.min(100, ((player.rating - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
        : 100;
    const ptsToNext = nextTier ? Math.max(0, nextTier.min - player.rating) : 0;

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className={`fade-in container`}>
            {/* ─── PROFILE HEADER ─── */}
            <div className="profile-header glass-panel">
                <div className="profile-avatar" style={{ border: `3px solid var(--primary-color)`, boxShadow: `0 0 30px var(--primary-glow)` }}>
                    {stats.elo.icon}
                </div>
                <div className="profile-main-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <h1 style={{ margin: 0 }}>{player.name}</h1>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {badges.map(badge => (
                                <span key={badge.id} className="achievement-badge" title={`${badge.name}: ${badge.desc}`} style={{ fontSize: '1.5rem', cursor: 'help' }}>
                                    {badge.icon}
                                </span>
                            ))}
                        </div>
                    </div>
                    <span className={`elo-badge ${stats.elo.class}`} style={{ fontSize: '1rem', marginTop: '0.3rem' }}>
                        {stats.elo.name}
                    </span>
                    <p className="subtitle" style={{ marginTop: '0.5rem', width: '100%', textAlign: 'center' }}>
                        {player.rating !== undefined ? player.rating : 1000} PDL
                    </p>
                    {/* Elo progress bar */}
                    <div style={{ width: '100%', maxWidth: '400px', marginTop: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                            <span>{currentTier.name} ({currentTier.min} PDL)</span>
                            {nextTier ? <span>{ptsToNext} PDL para {nextTier.name}</span> : <span>✨ PDL Máximo!</span>}
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${eloProgress}%`, height: '100%', background: 'linear-gradient(to right, var(--primary-color), #fff8)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                    </div>
                </div>
                <div className="season-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Temporada
                    </label>
                    <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
                        {getSeasonOptions(currentSeason).map(season => (
                            <option key={season} value={season}>
                                {season.replace('Season', 'Temporada')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ─── 8 STAT CARDS ─── */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <StatCard icon="🏆" label="Taxa de Vitória" value={`${stats.winrate}%`} color={parseFloat(stats.winrate) >= 50 ? 'var(--win-color)' : 'var(--loss-color)'} />
                <StatCard icon="⚔️" label="Partidas Totais" value={player.total} />
                <StatCard icon="✅" label="Vitórias / Derrotas" value={<span><span style={{ color: 'var(--win-color)' }}>{player.vitorias}W</span> / <span style={{ color: 'var(--loss-color)' }}>{player.derrotas}L</span></span>} />
                <StatCard icon="📈" label="PDL Atual" value={`${player.rating || 1000}`} sub="pontos da liga" color="var(--primary-color)" />
                <StatCard icon="🔝" label="PDL de Pico" value={stats.peakPDL} sub="máximo na temporada" color="#f5d37d" />
                <StatCard icon="🔻" label="PDL Mínimo" value={stats.bottomPDL} sub="mínimo na temporada" color="#ff7d7d" />
                <StatCard icon="⚡" label="Melhor Sequência W" value={stats.maxWStreak > 0 ? `${stats.maxWStreak}W` : '—'} color="var(--win-color)" />
                <StatCard icon="💀" label="Pior Sequência L" value={stats.maxLStreak > 0 ? `${stats.maxLStreak}L` : '—'} color="var(--loss-color)" />
            </div>

            {/* ─── PDL CHART ─── */}
            <PDLChart history={history} playerName={player.name} season={selectedSeason} />

            {/* ─── PDL STATS PANEL ─── */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Delta da Temporada</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: stats.pdlDelta >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>
                        {stats.pdlDelta >= 0 ? '+' : ''}{stats.pdlDelta} PDL
                    </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Pico</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f5d37d' }}>{stats.peakPDL} PDL</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Vale</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ff7d7d' }}>{stats.bottomPDL} PDL</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Partidas jogadas</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{player.total}</div>
                </div>
            </div>

            {/* ─── ADVERSÁRIO / KRIPTONITA + HEATMAP ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Adversário mais derrotado & Kriptonita */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem' }}>🎯 Desempenho por Adversário</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(0, 210, 106, 0.08)', borderRadius: '8px', border: '1px solid rgba(0,210,106,0.2)' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mais Derrotado ⚔️</div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.2rem' }}>
                                    {stats.mostDefeated ? (
                                        <Link to={`/player/${stats.mostDefeated[0]}`} style={{ color: 'var(--win-color)' }}>{stats.mostDefeated[0]}</Link>
                                    ) : '—'}
                                </div>
                            </div>
                            {stats.mostDefeated && (
                                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--win-color)' }}>{stats.mostDefeated[1]}x</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(248, 49, 47, 0.08)', borderRadius: '8px', border: '1px solid rgba(248,49,47,0.2)' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kriptonita 💀</div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.2rem' }}>
                                    {stats.kryptonite ? (
                                        <Link to={`/player/${stats.kryptonite[0]}`} style={{ color: 'var(--loss-color)' }}>{stats.kryptonite[0]}</Link>
                                    ) : '—'}
                                </div>
                            </div>
                            {stats.kryptonite && (
                                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--loss-color)' }}>{stats.kryptonite[1]}x venceu</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Weekly Heatmap */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '1.2rem' }}>📅 Atividade por Dia da Semana</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
                        {dayNames.map((day, idx) => {
                            const { wins, losses } = stats.daysMap[idx];
                            const total = wins + losses;
                            const intensity = total === 0 ? 0 : Math.min(1, total / 5);
                            const isGood = wins >= losses;
                            const bg = total === 0
                                ? 'rgba(255,255,255,0.04)'
                                : isGood
                                    ? `rgba(0, 210, 106, ${0.15 + intensity * 0.5})`
                                    : `rgba(248, 49, 47, ${0.15 + intensity * 0.5})`;
                            return (
                                <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                                    <div style={{ width: '100%', aspectRatio: '1', background: bg, borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                                        {total > 0 && (
                                            <>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--win-color)', fontWeight: 700 }}>{wins}W</span>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--loss-color)' }}>{losses}L</span>
                                            </>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day}</span>
                                </div>
                            );
                        })}
                    </div>
                    {stats.history.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem' }}>
                            Nenhuma partida com data/hora registrada.
                        </p>
                    )}
                </div>
            </div>

            {/* ─── SEQUÊNCIA + ALIADOS & RIVAIS ─── */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sequência Recente</span>
                    <Streak history={player.streak} />
                </div>
            </div>
            <div className="social-stats">
                <div className="social-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h4>🤝 Melhores Aliados</h4>
                    <div className="social-list">
                        {stats.allies.length > 0 ? stats.allies.map(([ally, count]) => (
                            <div key={ally} className="social-item">
                                <Link to={`/player/${ally}`} style={{ color: 'var(--text-main)' }}>{ally}</Link>
                                <span className="badge" style={{ background: 'var(--win-bg)', color: 'var(--win-color)' }}>{count} vitórias juntos</span>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)' }}>Nenhum aliado frequente ainda.</p>}
                    </div>
                </div>
                <div className="social-card glass-panel" style={{ padding: '1.5rem' }}>
                    <h4>⚔️ Maiores Rivais</h4>
                    <div className="social-list">
                        {stats.rivals.length > 0 ? stats.rivals.map(([rival, count]) => (
                            <div key={rival} className="social-item">
                                <Link to={`/player/${rival}`} style={{ color: 'var(--text-main)' }}>{rival}</Link>
                                <span className="badge" style={{ background: 'var(--loss-bg)', color: 'var(--loss-color)' }}>{count} derrotas para ele</span>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)' }}>Nenhum rival frequente ainda.</p>}
                    </div>
                </div>
            </div>

            {/* ─── HISTÓRICO DE PARTIDAS ─── */}
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
                    {stats.history.length === 0 ? (
                        <div className="empty-state">Nenhuma partida jogada nesta temporada.</div>
                    ) : isMobileView ? (
                        <div className="player-cards-grid">
                            {stats.history.map(match => {
                                const isWinner = match.winners.includes(player.name);
                                const myTeam = isWinner ? match.winners : match.losers;
                                const opponentTeam = isWinner ? match.losers : match.winners;
                                const teamSynergies = calculateTeamSynergies(history, myTeam, match.season || 'Season 1');

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
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                                                    <span className="value">{myTeam.filter(n => n !== player.name).join(', ')}</span>
                                                    <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                                                        {teamSynergies.map((s, idx) => (
                                                            <span key={idx} className={`synergy-tag ${s.type}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }} title={`Taxa de vitória: ${s.wr.toFixed(0)}%`}>
                                                                {s.type === 'good' ? '🔥' : '❄️'} {s.p1.slice(0, 4)} + {s.p2.slice(0, 4)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="stat-item">
                                                <span className="label">OPONENTES</span>
                                                <span className="value">{opponentTeam.join(', ')}</span>
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
                                    const myTeam = isWinner ? match.winners : match.losers;
                                    const opponentTeam = isWinner ? match.losers : match.winners;
                                    const teamSynergies = calculateTeamSynergies(history, myTeam, match.season || 'Season 1');

                                    return (
                                        <tr key={match.id} className="player-row" style={{ opacity: 1, animation: 'none' }}>
                                            <td>{match.date.split(' ')[0]}</td>
                                            <td className={isWinner ? 'winrate-high' : 'winrate-low'}>
                                                {isWinner ? 'VITÓRIA' : 'DERROTA'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span>{myTeam.filter(n => n !== player.name).join(', ')}</span>
                                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                        {teamSynergies.map((s, idx) => (
                                                            <span key={idx} className={`synergy-tag ${s.type}`} title={`Taxa de vitória: ${s.wr.toFixed(0)}%`}>
                                                                {s.type === 'good' ? '🔥' : '❄️'} {s.p1} + {s.p2}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{opponentTeam.join(', ')}</td>
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
