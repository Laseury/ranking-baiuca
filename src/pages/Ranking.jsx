import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import RankingTable from '../components/RankingTable';
import { getPlayersForSeason, getSeasonOptions, calculateRankingTrend } from '../utils/season';

import Swal from 'sweetalert2';

function Ranking() {
    const { players, history, currentSeason, changeSeason } = useContext(AppContext);
    const [selectedSeason, setSelectedSeason] = useState("Season 1");
    const [officialPlayers, setOfficialPlayers] = useState([]);
    const [provisionalPlayers, setProvisionalPlayers] = useState([]);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // Calculate ranking trend map
    const trends = useMemo(() => {
        let processedPlayers = getPlayersForSeason(players, history, selectedSeason, currentSeason);
        processedPlayers.sort((a, b) => {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos;
            return b.winrate - a.winrate;
        });
        return calculateRankingTrend(players, history, selectedSeason, processedPlayers);
    }, [players, history, selectedSeason, currentSeason]);

    // Calculate champions dynamically for Hall of Fame
    const champions = useMemo(() => {
        const seasonOptions = getSeasonOptions(currentSeason);
        const list = [];
        seasonOptions.forEach(season => {
            const seasonMatches = history.filter(m => 
                m.season === season || (!m.season && season === 'Season 1')
            );
            if (seasonMatches.length > 0) {
                const processed = getPlayersForSeason(players, history, season, currentSeason);
                processed.sort((a, b) => {
                    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
                    return b.winrate - a.winrate;
                });
                const champ = processed[0];
                if (champ && champ.total > 0) {
                    list.push({
                        season: season.replace('Season', 'Temporada'),
                        name: champ.name,
                        pdl: champ.pontos,
                        winrate: champ.winrate,
                        total: champ.total,
                        elo: champ.elo
                    });
                }
            }
        });
        return list;
    }, [players, history, currentSeason]);

    useEffect(() => {
        const handleResize = () => {
            // Só atualiza automaticamente se o usuário ainda não tiver "forçado" uma visão
            // Mas para simplificar, vamos deixar o usuário decidir.
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setSelectedSeason(currentSeason);
    }, [currentSeason]);

    useEffect(() => {
        let processedPlayers = getPlayersForSeason(players, history, selectedSeason, currentSeason);

        processedPlayers.sort((a, b) => {
            if (b.pontos !== a.pontos) {
                return b.pontos - a.pontos;
            }
            return b.winrate - a.winrate;
        });

        setOfficialPlayers(processedPlayers.filter(p => p.total >= 10));
        setProvisionalPlayers(processedPlayers.filter(p => p.total < 10));
    }, [players, history, selectedSeason, currentSeason]);

    const handleNextSeason = async () => {
        const { value: code } = await Swal.fire({
            title: 'Iniciar Nova Temporada?',
            text: 'Isso irá arquivar o ranking atual e começar um novo. Digite o código de confirmação:',
            input: 'password',
            inputPlaceholder: 'Código baiuca',
            showCancelButton: true,
            background: '#0a0e14',
            color: '#f0e6d2',
            confirmButtonColor: '#c89b3c'
        });

        if (code === 'baiuca') {
            const nextSeasonNum = parseInt(currentSeason.split(' ')[1]) || 1;
            const newSeasonName = `Season ${nextSeasonNum + 1}`;
            await changeSeason(newSeasonName);
            Swal.fire('Sucesso!', `Iniciada a ${newSeasonName}`, 'success');
        } else if (code) {
            Swal.fire('Erro', 'Código incorreto!', 'error');
        }
    };

    const mvp = officialPlayers[0] || provisionalPlayers[0] || null;
    const bestWinrate = [...officialPlayers].sort((a, b) => b.winrate - a.winrate)[0];
    const mostExp = [...officialPlayers, ...provisionalPlayers].sort((a, b) => b.total - a.total)[0];

    return (
        <div className="fade-in">
            <header>
                <div className="logo-glow"></div>
                <h1>LEAGUE <span>OF</span> LEGENDS</h1>
                <div className="header-controls">
                    <p className="subtitle">Ranking Competitivo</p>
                    <div className="season-selector" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
                            {getSeasonOptions(currentSeason).map(season => (
                                <option key={season} value={season}>
                                    {season.replace('Season', 'Temporada')}
                                </option>
                            ))}
                        </select>
                        <button className="btn purple-btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={handleNextSeason}>
                            Nova Temp.
                        </button>
                    </div>
                    <button 
                        className="btn secondary-btn" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}
                        onClick={() => setIsMobileView(!isMobileView)}
                    >
                        {isMobileView ? 'Ver Modo Desktop 🖥️' : 'Ver Modo Mobile 📱'}
                    </button>
                </div>
            </header>

            <div className="dashboard-grid">
                {mvp && (
                    <div className="dashboard-card glass-panel">
                        <div className="card-icon">👑</div>
                        <div className="card-info">
                            <h4>MVP Atual</h4>
                            <span className="card-value">{mvp.name}</span>
                            <span className="card-sub">{mvp.pontos} Pontos</span>
                        </div>
                    </div>
                )}
                {bestWinrate && (
                    <div className="dashboard-card glass-panel">
                        <div className="card-icon">🎯</div>
                        <div className="card-info">
                            <h4>Maior Winrate</h4>
                            <span className="card-value">{bestWinrate.name}</span>
                            <span className="card-sub">{bestWinrate.winrate}%</span>
                        </div>
                    </div>
                )}
                {mostExp && (
                    <div className="dashboard-card glass-panel">
                        <div className="card-icon">⚔️</div>
                        <div className="card-info">
                            <h4>Mais Experiente</h4>
                            <span className="card-value">{mostExp.name}</span>
                            <span className="card-sub">{mostExp.total} Partidas</span>
                        </div>
                    </div>
                )}
            </div>

            {champions.length > 0 && (
                <section className="ranking-section hall-of-fame-section">
                    <div className="section-header">
                        <h2>🏆 Galeria de Campeões (Hall da Fama)</h2>
                        <span className="badge">Histórico</span>
                    </div>
                    <div className="hall-of-fame-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                        {champions.map((champ, index) => (
                            <div key={index} className="dashboard-card glass-panel hall-of-fame-card" style={{
                                animation: 'none',
                                borderTop: '3px solid #ffd700',
                                boxShadow: '0 0 15px rgba(255, 215, 0, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '1.5rem',
                                gap: '0.8rem'
                            }}>
                                <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' }}>🏆</div>
                                <div style={{ textAlign: 'center' }}>
                                    <h5 style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>
                                        {champ.season}
                                    </h5>
                                    <span className="card-value" style={{ fontSize: '1.4rem', textShadow: '0 0 8px rgba(255, 215, 0, 0.5)' }}>{champ.name}</span>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <span className="badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', background: 'rgba(255, 215, 0, 0.1)', color: '#ffd700', borderColor: '#ffd700' }}>
                                            {champ.pdl} PDL
                                        </span>
                                        <span className="badge warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                                            {champ.winrate}% WR
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="ranking-section">
                <div className="section-header">
                    <h2>Ranking Oficial</h2>
                    <span className="badge">10+ Partidas</span>
                </div>
                <div className={`table-container ${isMobileView ? 'mobile-grid' : 'glass-panel'}`}>
                    <RankingTable players={officialPlayers} isOfficial={true} isMobileView={isMobileView} trends={trends} />
                </div>
            </section>

            <section className="ranking-section provisional">
                <div className="section-header">
                    <h2>Ranking Provisório</h2>
                    <span className="badge warning">Menos de 10 Partidas</span>
                </div>
                <div className={`table-container ${isMobileView ? 'mobile-grid' : 'glass-panel'}`}>
                    <RankingTable players={provisionalPlayers} isOfficial={false} isMobileView={isMobileView} trends={trends} />
                </div>
            </section>
        </div>
    );
}

export default Ranking;
