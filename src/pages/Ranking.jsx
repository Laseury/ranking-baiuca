import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import RankingTable from '../components/RankingTable';
import PlayerAvatar from '../components/PlayerAvatar';
import { getPlayersForSeason, getSeasonOptions, calculateRankingTrend, calculateAchievements } from '../utils/season';

import Swal from 'sweetalert2';

const allAchievementsList = [
    { id: 'sovereign', icon: '👑', name: 'Soberano', desc: 'Líder atual do ranking oficial (Rank #1).' },
    { id: 'invincible', icon: '⚡', name: 'Imbatível', desc: 'Sequência incrível de 5 ou mais vitórias seguidas!' },
    { id: 'on-fire', icon: '🔥', name: 'On Fire', desc: 'Sequência de 3 ou 4 vitórias seguidas!' },
    { id: 'ascendant', icon: '🚀', name: 'Ascendente', desc: 'Ganhou as últimas duas partidas!' },
    { id: 'punching-bag', icon: '🤕', name: 'Saco de Pancadas', desc: 'Sequência de 3 ou mais derrotas seguidas. Dias melhores virão!' },
    { id: 'unstoppable', icon: '🛡️', name: 'Inabalável', desc: 'Taxa de vitória de 60% ou mais com pelo menos 10 partidas!' },
    { id: 'marathoner', icon: '⚔️', name: 'Maratonista', desc: 'O guerreiro com mais partidas disputadas na temporada!' },
    { id: 'veteran', icon: '🧙‍♂️', name: 'Veterano', desc: 'Disputou 20 ou mais partidas na temporada!' },
    { id: 'mvp-slayer', icon: '🎯', name: 'Algoz do Líder', desc: 'Venceu o líder do ranking mais vezes na temporada (mínimo 2 vitórias).' },
    { id: 'promise', icon: '🌱', name: 'Promessa', desc: 'Jogador provisório (menos de 10 jogos) com Winrate de 60% a 79% (mínimo 3 partidas).' },
    { id: 'cold-foot', icon: '❄️', name: 'Pé Frio', desc: 'Jogador oficial (10+ jogos) com Winrate abaixo de 35%.' },
    { id: 'carrasco', icon: '🩸', name: 'Carrasco', desc: 'Taxa de vitória implacável de 70% ou mais na temporada (mínimo 5 partidas).' },
    { id: 'wall', icon: '🧱', name: 'Muralha', desc: 'Defesa impenetrável: mais de 10 jogos disputados e no máximo 4 derrotas no total.' },
    { id: 'joker', icon: '🃏', name: 'Curinga', desc: 'Disputou partidas com pelo menos 5 parceiros de equipe diferentes nesta temporada!' },
    { id: 'smurf', icon: '⚡🌱', name: 'Smurf', desc: 'Desempenho avassalador de 80% ou mais com menos de 10 jogos (mínimo 3 partidas).' },
    { id: 'divine', icon: '🌌', name: 'Divino', desc: 'Alcançou o patamar celestial de 1200 ou mais PDL!' },
    { id: 'carry', icon: '🎒', name: 'Carregador', desc: 'Carregou o piano! Winrate de 65% ou mais com 15+ jogos na temporada.' },
    { id: 'void-child', icon: '👾', name: 'Filho do Vazio', desc: 'Sequência terrível de 5 ou mais derrotas seguidas!' },
    { id: 'unbreakable', icon: '🛡️', name: 'Espírito Inquebrável', desc: 'Disputou pelo menos 30 partidas na temporada.' },
    { id: 'gladiator', icon: '⚔️', name: 'Gladiador', desc: 'Venceu pelo menos 12 partidas na temporada.' },
    { id: 'destroyer', icon: '💥', name: 'Destruidor', desc: 'Venceu pelo menos 15 partidas na temporada.' },
    { id: 'lantern', icon: '🏮', name: 'Lanterna Vermelha', desc: 'Jogador oficial (10+ jogos) na última colocação em PDL da temporada.' },
    { id: 'legendary-summoner', icon: '🐉', name: 'Invocador Lendário', desc: 'Atingiu o prestigiado Elo Mestre ou superior na temporada (1800+ PDL).' },
    { id: 'perfect-balance', icon: '☯️', name: 'Equilíbrio Perfeito', desc: 'Jogador oficial com exatamente 50% de Winrate (equilíbrio total).' },
    { id: 'general', icon: '🎖️', name: 'General da Baiuca', desc: 'Recordista absoluto de vitórias da temporada!' },
    { id: 'collector', icon: '💎', name: 'Colecionador', desc: 'Detentor de 4 ou mais medalhas/títulos ativos simultaneamente!' }
];

function Ranking() {
    const { players, history, currentSeason, changeSeason } = useContext(AppContext);
    const [selectedSeason, setSelectedSeason] = useState("Season 1");
    const [officialPlayers, setOfficialPlayers] = useState([]);
    const [provisionalPlayers, setProvisionalPlayers] = useState([]);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEloFilter, setSelectedEloFilter] = useState('All');
    const [showAchievementsLibrary, setShowAchievementsLibrary] = useState(false);

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
                
                // Override for Season 1 to show Ministro as requested
                let champ;
                if (season === "Season 1") {
                    champ = processed.find(p => p.name === "Ministro") || processed[0];
                } else {
                    champ = processed[0];
                }

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

    let mvp = officialPlayers[0] || provisionalPlayers[0] || null;
    let bestWinrate = [...officialPlayers].sort((a, b) => b.winrate - a.winrate)[0];
    const mostLosses = [...officialPlayers, ...provisionalPlayers].sort((a, b) => b.derrotas - a.derrotas)[0];

    // Force Ministro as MVP and Best Winrate for Season 1 dashboard cards
    if (selectedSeason === "Season 1") {
        const ministro = [...officialPlayers, ...provisionalPlayers].find(p => p.name === "Ministro");
        if (ministro) {
            mvp = ministro;
            bestWinrate = ministro;
        }
    }

    const filteredOfficial = useMemo(() => {
        return officialPlayers.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesElo = selectedEloFilter === 'All' || p.elo?.name === selectedEloFilter;
            return matchesSearch && matchesElo;
        });
    }, [officialPlayers, searchTerm, selectedEloFilter]);

    const filteredProvisional = useMemo(() => {
        return provisionalPlayers.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesElo = selectedEloFilter === 'All' || p.elo?.name === selectedEloFilter;
            return matchesSearch && matchesElo;
        });
    }, [provisionalPlayers, searchTerm, selectedEloFilter]);

    const top3 = useMemo(() => {
        const list = [...officialPlayers];
        if (list.length < 3) {
            provisionalPlayers.forEach(p => {
                if (list.length < 3 && !list.some(x => x.name === p.name)) {
                    list.push(p);
                }
            });
        }
        return list.slice(0, 3);
    }, [officialPlayers, provisionalPlayers]);

    const recentSeasonMatches = useMemo(() => {
        return history
            .filter(m => m.season === selectedSeason || (!m.season && selectedSeason === 'Season 1'))
            .slice(0, 3);
    }, [history, selectedSeason]);

    const eloDistribution = useMemo(() => {
        const counts = {
            'Lenda': 0, 'Radiante': 0, 'Challenger': 0, 'Grão-Mestre': 0, 'Mestre': 0,
            'Safira': 0, 'Rubi': 0, 'Diamante': 0, 'Esmeralda': 0, 'Platina': 0,
            'Ouro': 0, 'Prata': 0, 'Bronze': 0, 'Ferro': 0, 'Cobre': 0, 'Pedra': 0,
            'Madeira': 0, 'Papelão': 0, 'Plástico': 0
        };
        const totalPlayers = officialPlayers.length + provisionalPlayers.length;
        [...officialPlayers, ...provisionalPlayers].forEach(p => {
            const eloName = p.elo?.name || 'Ferro';
            if (counts[eloName] !== undefined) {
                counts[eloName]++;
            }
        });
        return { counts, totalPlayers };
    }, [officialPlayers, provisionalPlayers]);

    const achievementsWithPlayers = useMemo(() => {
        const map = {};
        allAchievementsList.forEach(ach => {
            map[ach.id] = { ...ach, unlockedBy: [] };
        });

        const allPlayers = [...officialPlayers, ...provisionalPlayers];
        const seasonPlayers = getPlayersForSeason(players, history, selectedSeason, currentSeason);
        
        allPlayers.forEach(p => {
            const pSeason = seasonPlayers.find(x => x.name === p.name);
            if (pSeason) {
                const badges = calculateAchievements(pSeason, seasonPlayers, history, selectedSeason);
                badges.forEach(b => {
                    if (map[b.id]) {
                        map[b.id].unlockedBy.push(p.name);
                    }
                });
            }
        });

        return Object.values(map);
    }, [officialPlayers, provisionalPlayers, players, history, selectedSeason, currentSeason]);

    const p1 = top3[0];
    const p2 = top3[1];
    const p3 = top3[2];

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
                {mostLosses && (
                    <div className="dashboard-card glass-panel">
                        <div className="card-icon">💀</div>
                        <div className="card-info">
                            <h4>Mais Derrotas</h4>
                            <span className="card-value">{mostLosses.name}</span>
                            <span className="card-sub">{mostLosses.derrotas} Derrotas</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── BARRA DE BUSCA E FILTRO ── */}
            <div className="search-filter-bar glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="search-input-wrapper" style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Buscar jogador..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '6px',
                                color: 'var(--text-main)',
                                fontFamily: 'Outfit, sans-serif'
                            }}
                        />
                    </div>
                    <div className="elo-filter-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                            className={`btn ${selectedEloFilter === 'All' ? 'purple-btn' : 'secondary-btn'}`}
                            onClick={() => setSelectedEloFilter('All')}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '20px' }}
                        >
                            Todos
                        </button>
                        {['Plástico', 'Papelão', 'Madeira', 'Pedra', 'Cobre', 'Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Rubi', 'Safira', 'Mestre', 'Grão-Mestre', 'Challenger', 'Radiante', 'Lenda'].map(eloName => {
                            const eloIcons = {
                                'Plástico': '🥤', 'Papelão': '📦', 'Madeira': '🪵', 'Pedra': '🪨', 'Cobre': '🟫',
                                'Ferro': '⚙️', 'Bronze': '🥉', 'Prata': '🥈', 'Ouro': '🥇', 
                                'Platina': '💠', 'Esmeralda': '✳️', 'Diamante': '💎', 'Rubi': '🔻', 'Safira': '🔹',
                                'Mestre': '👑', 'Grão-Mestre': '🔴', 'Challenger': '🏆', 'Radiante': '✨', 'Lenda': '🐉'
                            };
                            const eloClassMap = {
                                'Plástico': 'plastico', 'Papelão': 'papelao', 'Madeira': 'madeira', 'Pedra': 'pedra', 'Cobre': 'cobre',
                                'Ferro': 'ferro', 'Bronze': 'bronze', 'Prata': 'prata', 'Ouro': 'ouro',
                                'Platina': 'platina', 'Esmeralda': 'esmeralda', 'Diamante': 'diamante', 'Rubi': 'rubi', 'Safira': 'safira',
                                'Mestre': 'mestre', 'Grão-Mestre': 'grao-mestre', 'Challenger': 'challenger', 'Radiante': 'radiante', 'Lenda': 'lenda'
                            };
                            const isActive = selectedEloFilter === eloName;
                            return (
                                <button 
                                    key={eloName}
                                    className={`btn ${isActive ? `active-${eloClassMap[eloName]}` : 'secondary-btn'}`}
                                    onClick={() => setSelectedEloFilter(eloName)}
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    <span>{eloIcons[eloName]}</span> {eloName}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── RANKING OFICIAL ── */}
            <section className="ranking-section">
                <div className="section-header">
                    <h2>Ranking Oficial</h2>
                    <span className="badge">10+ Partidas</span>
                </div>
                {isMobileView ? (
                    <div className="mobile-grid">
                        <RankingTable players={filteredOfficial} isOfficial={true} isMobileView={isMobileView} trends={trends} />
                    </div>
                ) : (
                    <div className="glass-panel">
                        <div className="table-container">
                            <RankingTable players={filteredOfficial} isOfficial={true} isMobileView={isMobileView} trends={trends} />
                        </div>
                    </div>
                )}
            </section>

            {/* ── RANKING PROVISÓRIO ── */}
            <section className="ranking-section provisional">
                <div className="section-header">
                    <h2>Ranking Provisório</h2>
                    <span className="badge warning">Menos de 10 Partidas</span>
                </div>
                {isMobileView ? (
                    <div className="mobile-grid">
                        <RankingTable players={filteredProvisional} isOfficial={false} isMobileView={isMobileView} trends={trends} />
                    </div>
                ) : (
                    <div className="glass-panel">
                        <div className="table-container">
                            <RankingTable players={filteredProvisional} isOfficial={false} isMobileView={isMobileView} trends={trends} />
                        </div>
                    </div>
                )}
            </section>

            {/* ══ SEÇÕES EXTRAS — abaixo do ranking ══ */}

            {/* Pódio do Top 3 */}
            {top3.length > 0 && (
                <section className="ranking-section podium-section">
                    <div className="section-header">
                        <h2>🏆 Pódio dos Melhores</h2>
                        <span className="badge">Top 3 da Temporada</span>
                    </div>
                    <div className="podium-container glass-panel">
                        {p2 && (
                            <div className="podium-card rank-2-card">
                                <div className="podium-position-badge">#2</div>
                                <div className="podium-avatar-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
                                    <PlayerAvatar name={p2.name} elo={p2.elo} style={{ width: '48px', height: '48px' }} />
                                </div>
                                <Link to={`/player/${p2.name}`} className="podium-player-name">{p2.name}</Link>
                                <div className="podium-stats-row">
                                    <span className="podium-stat pdl">{p2.pontos} PDL</span>
                                    <span className="podium-stat wr">{p2.winrate}% WR</span>
                                </div>
                            </div>
                        )}
                        {p1 && (
                            <div className="podium-card rank-1-card">
                                <div className="podium-crown-badge">👑</div>
                                <div className="podium-avatar-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
                                    <PlayerAvatar name={p1.name} elo={p1.elo} style={{ width: '56px', height: '56px' }} />
                                </div>
                                <Link to={`/player/${p1.name}`} className="podium-player-name">{p1.name}</Link>
                                <div className="podium-stats-row">
                                    <span className="podium-stat pdl">{p1.pontos} PDL</span>
                                    <span className="podium-stat wr">{p1.winrate}% WR</span>
                                </div>
                            </div>
                        )}
                        {p3 && (
                            <div className="podium-card rank-3-card">
                                <div className="podium-position-badge">#3</div>
                                <div className="podium-avatar-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
                                    <PlayerAvatar name={p3.name} elo={p3.elo} style={{ width: '48px', height: '48px' }} />
                                </div>
                                <Link to={`/player/${p3.name}`} className="podium-player-name">{p3.name}</Link>
                                <div className="podium-stats-row">
                                    <span className="podium-stat pdl">{p3.pontos} PDL</span>
                                    <span className="podium-stat wr">{p3.winrate}% WR</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            <div className="stats-layout-grid">
                {/* Novidade 3: Feed de Partidas Recentes */}
                {recentSeasonMatches.length > 0 && (
                    <section className="ranking-section recent-matches-section">
                        <div className="section-header">
                            <h2>⚔️ Partidas Recentes</h2>
                            <span className="badge">Histórico Rápido</span>
                        </div>
                        <div className="recent-matches-grid">
                            {recentSeasonMatches.map((match) => (
                                <div key={match.id} className="recent-match-card glass-panel">
                                    <div className="recent-match-header">
                                        <span className="recent-match-date">{match.date?.split(' ')[0]}</span>
                                        <span className="recent-match-pdl">+{match.pontosGanhos || 20} PDL</span>
                                    </div>
                                    <div className="recent-match-teams">
                                        <div className="recent-match-team winners">
                                            {match.winners?.map(name => (
                                                <Link to={`/player/${name}`} key={name} className="recent-match-player">{name}</Link>
                                            ))}
                                        </div>
                                        <div className="recent-match-vs">VS</div>
                                        <div className="recent-match-team losers">
                                            {match.losers?.map(name => (
                                                <Link to={`/player/${name}`} key={name} className="recent-match-player">{name}</Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Novidade 4: Distribuição de Elo */}
                <section className="ranking-section elo-dist-section">
                    <div className="section-header">
                        <h2>📊 Distribuição de Elo</h2>
                        <span className="badge">Estatísticas</span>
                    </div>
                    <div className="elo-dist-card glass-panel">
                        <div className="elo-dist-grid">
                            {Object.entries(eloDistribution.counts).map(([eloName, count]) => {
                                const percentage = eloDistribution.totalPlayers > 0 
                                    ? (count / eloDistribution.totalPlayers) * 100 
                                    : 0;
                                if (count === 0) return null;
                                
                                const eloClasses = {
                                    'Lenda': 'elo-legend', 'Radiante': 'elo-radiant', 'Challenger': 'elo-challenger',
                                    'Grão-Mestre': 'elo-grandmaster', 'Mestre': 'elo-master', 'Safira': 'elo-sapphire',
                                    'Rubi': 'elo-ruby', 'Diamante': 'elo-diamond', 'Esmeralda': 'elo-emerald',
                                    'Platina': 'elo-platinum', 'Ouro': 'elo-gold', 'Prata': 'elo-silver',
                                    'Bronze': 'elo-bronze', 'Ferro': 'elo-iron', 'Cobre': 'elo-copper',
                                    'Pedra': 'elo-stone', 'Madeira': 'elo-wood', 'Papelão': 'elo-cardboard',
                                    'Plástico': 'elo-plastic'
                                };
                                const eloIcons = {
                                    'Lenda': '🐉', 'Radiante': '✨', 'Challenger': '🏆', 'Grão-Mestre': '🔴',
                                    'Mestre': '👑', 'Safira': '🔹', 'Rubi': '🔻', 'Diamante': '💎',
                                    'Esmeralda': '✳️', 'Platina': '💠', 'Ouro': '🥇', 'Prata': '🥈',
                                    'Bronze': '🥉', 'Ferro': '⚙️', 'Cobre': '🟫', 'Pedra': '🪨',
                                    'Madeira': '🪵', 'Papelão': '📦', 'Plástico': '🥤'
                                };
                                
                                return (
                                    <div key={eloName} className="elo-dist-item">
                                        <div className="elo-dist-label">
                                            <span className={`elo-badge ${eloClasses[eloName]}`}>
                                                {eloIcons[eloName]} {eloName}
                                            </span>
                                            <span className="elo-dist-count">{count} ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="elo-dist-progress-bg">
                                            <div 
                                                className={`elo-dist-progress-bar ${eloClasses[eloName]}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Novidade 5: Galeria de Conquistas */}
            <section className="ranking-section achievements-library-section">
                <div className="section-header" style={{ justifyContent: 'space-between' }}>
                    <h2>🏆 Biblioteca de Medalhas</h2>
                    <button 
                        className="btn secondary-btn"
                        onClick={() => setShowAchievementsLibrary(!showAchievementsLibrary)}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    >
                        {showAchievementsLibrary ? 'Ocultar Medalhas 📂' : 'Mostrar Medalhas 📁'}
                    </button>
                </div>
                
                {showAchievementsLibrary && (
                    <div className="achievements-library-grid fade-in">
                        {achievementsWithPlayers.map((ach) => (
                            <div key={ach.id} className="achievement-library-card glass-panel">
                                <div className="ach-lib-header">
                                    <span className="ach-lib-icon">{ach.icon}</span>
                                    <h4 className="ach-lib-name">{ach.name}</h4>
                                </div>
                                <p className="ach-lib-desc">{ach.desc}</p>
                                <div className="ach-lib-unlocked">
                                    <span className="ach-lib-unlocked-title">Detentores:</span>
                                    {ach.unlockedBy.length > 0 ? (
                                        <div className="ach-lib-unlocked-list">
                                            {ach.unlockedBy.map(name => (
                                                <Link to={`/player/${name}`} key={name} className="ach-lib-player-link">{name}</Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="ach-lib-no-players">Nenhum jogador</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

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
        </div>
    );
}

export default Ranking;
