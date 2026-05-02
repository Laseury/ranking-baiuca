import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import RankingTable from '../components/RankingTable';

function processPlayers(players) {
    return players.map(player => {
        const winrate = player.total > 0 ? ((player.vitorias / player.total) * 100).toFixed(1) : 0;
        // Agora usamos o rating (PDL) como a pontuação principal
        const pontos = player.rating !== undefined ? player.rating : (1000 + (player.vitorias - player.derrotas) * 20);

        return {
            ...player,
            winrate: parseFloat(winrate),
            pontos
        };
    });
}

function Ranking() {
    const { players } = useContext(AppContext);
    const [officialPlayers, setOfficialPlayers] = useState([]);
    const [provisionalPlayers, setProvisionalPlayers] = useState([]);

    useEffect(() => {
        const processedPlayers = processPlayers(players);

        processedPlayers.sort((a, b) => {
            if (b.pontos !== a.pontos) {
                return b.pontos - a.pontos;
            }
            return b.winrate - a.winrate;
        });

        setOfficialPlayers(processedPlayers.filter(p => p.total >= 10));
        setProvisionalPlayers(processedPlayers.filter(p => p.total < 10));
    }, [players]);

    const getMVP = () => {
        if (!players.length) return null;
        return [...processPlayers(players)].sort((a, b) => b.pontos - a.pontos)[0];
    };

    const getBestWinrate = () => {
        const eligible = processPlayers(players).filter(p => p.total >= 10);
        if (!eligible.length) return null;
        return [...eligible].sort((a, b) => b.winrate - a.winrate)[0];
    };

    const getMostExperienced = () => {
        if (!players.length) return null;
        return [...players].sort((a, b) => b.total - a.total)[0];
    };

    const mvp = getMVP();
    const bestWinrate = getBestWinrate();
    const mostExp = getMostExperienced();

    return (
        <div className="fade-in">
            <header>
                <div className="logo-glow"></div>
                <h1>LEAGUE <span>OF</span> LEGENDS</h1>
                <p className="subtitle">Ranking Competitivo</p>
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
                <div className="table-container glass-panel">
                    <RankingTable players={officialPlayers} isOfficial={true} />
                </div>
            </section>

            <section className="ranking-section provisional">
                <div className="section-header">
                    <h2>Ranking Provisório</h2>
                    <span className="badge warning">Menos de 10 Partidas</span>
                </div>
                <div className="table-container glass-panel">
                    <RankingTable players={provisionalPlayers} isOfficial={false} />
                </div>
            </section>
        </div>
    );
}

export default Ranking;
