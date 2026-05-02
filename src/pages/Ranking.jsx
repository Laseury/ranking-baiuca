import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import RankingTable from '../components/RankingTable';
import { getElo } from '../utils/elo';

function processPlayersBySeason(players, history, selectedSeason) {
    // 1. Inicializa estatísticas da temporada para todos os jogadores
    const seasonStats = {};
    players.forEach(p => {
        seasonStats[p.name] = {
            ...p,
            vitorias: 0,
            derrotas: 0,
            total: 0,
            rating: 1000,
            streak: []
        };
    });

    // 2. Filtra o histórico pela temporada selecionada
    // Se a partida não tiver season, assumimos Season 1
    const seasonMatches = history.filter(m => 
        m.season === selectedSeason || (!m.season && selectedSeason === 'Season 1')
    );

    // 3. Recalcula estatísticas a partir das partidas (em ordem cronológica)
    [...seasonMatches].sort((a, b) => a.timestamp - b.timestamp).forEach(match => {
        match.winners.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].vitorias++;
                seasonStats[name].total++;
                seasonStats[name].rating += (match.pontosGanhos || 20);
                seasonStats[name].streak = [...(seasonStats[name].streak || []), "W"].slice(-5);
            }
        });
        match.losers.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].derrotas++;
                seasonStats[name].total++;
                seasonStats[name].rating = Math.max(0, seasonStats[name].rating - (match.pontosPerdidos || 20));
                seasonStats[name].streak = [...(seasonStats[name].streak || []), "L"].slice(-5);
            }
        });
    });

    // 4. Formata dados finais e calcula Elos
    return Object.values(seasonStats).map(player => {
        const winrate = player.total > 0 ? ((player.vitorias / player.total) * 100).toFixed(1) : 0;
        const elo = getElo(player.rating);
        return {
            ...player,
            winrate: parseFloat(winrate),
            pontos: player.rating,
            elo
        };
    });
}

import Swal from 'sweetalert2';

function Ranking() {
    const { players, history, currentSeason, changeSeason } = useContext(AppContext);
    const [selectedSeason, setSelectedSeason] = useState("Season 1");
    const [officialPlayers, setOfficialPlayers] = useState([]);
    const [provisionalPlayers, setProvisionalPlayers] = useState([]);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

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
        let processedPlayers;

        if (selectedSeason === currentSeason && selectedSeason === "Season 1") {
            // Caso especial para a Temporada 1 original manter os pontos migrados
            processedPlayers = players.map(p => {
                const winrate = p.total > 0 ? ((p.vitorias / p.total) * 100).toFixed(1) : 0;
                const rating = p.rating !== undefined ? p.rating : (1000 + (p.vitorias - p.derrotas) * 20);
                return {
                    ...p,
                    winrate: parseFloat(winrate),
                    pontos: rating,
                    elo: getElo(rating)
                };
            });
        } else {
            // Para novas temporadas ou consulta de históricas, recalcula do zero a partir do histórico
            processedPlayers = processPlayersBySeason(players, history, selectedSeason);
        }

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
                            <option value="Season 1">Temporada 1</option>
                            {currentSeason !== "Season 1" && <option value={currentSeason}>{currentSeason.replace('Season', 'Temporada')}</option>}
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

            <section className="ranking-section">
                <div className="section-header">
                    <h2>Ranking Oficial</h2>
                    <span className="badge">10+ Partidas</span>
                </div>
                <div className={`table-container ${isMobileView ? 'mobile-grid' : 'glass-panel'}`}>
                    <RankingTable players={officialPlayers} isOfficial={true} isMobileView={isMobileView} />
                </div>
            </section>

            <section className="ranking-section provisional">
                <div className="section-header">
                    <h2>Ranking Provisório</h2>
                    <span className="badge warning">Menos de 10 Partidas</span>
                </div>
                <div className={`table-container ${isMobileView ? 'mobile-grid' : 'glass-panel'}`}>
                    <RankingTable players={provisionalPlayers} isOfficial={false} isMobileView={isMobileView} />
                </div>
            </section>
        </div>
    );
}

export default Ranking;
