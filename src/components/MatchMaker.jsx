import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';

const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

function MatchMaker({ players, onMatchResult }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [teamA, setTeamA] = useState([]);
    const [teamB, setTeamB] = useState([]);
    const [matchOngoing, setMatchOngoing] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    
    // Estados do Modo Manual
    const [manualWinners, setManualWinners] = useState([]);
    const [manualLosers, setManualLosers] = useState([]);

    // Persistência para agilizar novos sorteios
    const [lastMatchTeams, setLastMatchTeams] = useState(null);
    const [drawMethod, setDrawMethod] = useState(null);

    // Estados premium de animação e comemoração
    const [isShuffling, setIsShuffling] = useState(false);
    const [celebrationData, setCelebrationData] = useState(null);
    const [animatedPdl, setAnimatedPdl] = useState(0);

    // Efeito para contar de 0 até o PDL de comemoração de forma animada
    useEffect(() => {
        if (celebrationData) {
            setAnimatedPdl(0);
            let start = 0;
            const end = celebrationData.points;
            if (end === 0) return;
            const duration = 1200; // 1.2s total duration
            const stepTime = Math.max(Math.floor(duration / end), 20); // min 20ms step
            
            const timer = setInterval(() => {
                start += 1;
                if (start >= end) {
                    setAnimatedPdl(end);
                    clearInterval(timer);
                } else {
                    setAnimatedPdl(start);
                }
            }, stepTime);
            
            return () => clearInterval(timer);
        } else {
            setAnimatedPdl(0);
        }
    }, [celebrationData]);

    const togglePlayer = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(playerId => playerId !== id));
        } else {
            // max 10 players
            if (selectedIds.length < 10) {
                setSelectedIds([...selectedIds, id]);
            }
        }
    };

    const handleSortear = () => {
        if (selectedIds.length < 6 || selectedIds.length % 2 !== 0) return;
        setIsShuffling(true);

        setTimeout(() => {
            // Shuffle
            const shuffled = shuffleArray(selectedIds);
            
            const half = Math.floor(shuffled.length / 2);
            const tA = shuffled.slice(0, half).map(id => players.find(p => p.id === id));
            const tB = shuffled.slice(half).map(id => players.find(p => p.id === id));

            setTeamA(shuffleArray(tA));
            setTeamB(shuffleArray(tB));
            setDrawMethod('puro');
            setIsShuffling(false);
            setMatchOngoing(true);
        }, 1500);
    };

    const handleSortearEquilibrado = () => {
        if (selectedIds.length < 6 || selectedIds.length % 2 !== 0) return;
        setIsShuffling(true);

        setTimeout(() => {
            const selectedPlayers = selectedIds.map(id => players.find(p => p.id === id));
            
            // Geração de todas as combinações possíveis de tamanho k
            function getCombinations(array, k) {
                const result = [];
                function helper(start, combo) {
                    if (combo.length === k) {
                        result.push([...combo]);
                        return;
                    }
                    for (let i = start; i < array.length; i++) {
                        combo.push(array[i]);
                        helper(i + 1, combo);
                        combo.pop();
                    }
                }
                helper(0, []);
                return result;
            }

            const teamSize = selectedPlayers.length / 2;
            const combos = getCombinations(selectedPlayers, teamSize);
            const uniquePartitions = [];
            const seenKeys = new Set();

            for (const teamA of combos) {
                const teamB = selectedPlayers.filter(p => !teamA.some(ta => ta.id === p.id));
                
                // Chave de ordenação independente para evitar duplicados espelhados (Time A vs B === B vs A)
                const idA = teamA.map(p => p.id).sort().join(',');
                const idB = teamB.map(p => p.id).sort().join(',');
                const key = [idA, idB].sort().join('|');

                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    const sumA = teamA.reduce((sum, p) => sum + getRating(p), 0);
                    const sumB = teamB.reduce((sum, p) => sum + getRating(p), 0);
                    uniquePartitions.push({
                        teamA,
                        teamB,
                        diff: Math.abs(sumA - sumB)
                    });
                }
            }

            // Shuffle partitions first to randomize ties with the same 'diff'
            const shuffledPartitions = shuffleArray(uniquePartitions);
            shuffledPartitions.sort((a, b) => a.diff - b.diff);

            // Escolher aleatoriamente entre as top 5 combinações mais equilibradas para manter o fator surpresa
            const poolLimit = Math.min(5, shuffledPartitions.length);
            const randomIndex = Math.floor(Math.random() * poolLimit);
            const bestPartition = shuffledPartitions[randomIndex];

            // Sorteia quem exibe como Time A e Time B, and shuffle players within teams
            const finalTeamA = shuffleArray(bestPartition.teamA);
            const finalTeamB = shuffleArray(bestPartition.teamB);

            if (Math.random() > 0.5) {
                setTeamA(finalTeamA);
                setTeamB(finalTeamB);
            } else {
                setTeamA(finalTeamB);
                setTeamB(finalTeamA);
            }
            
            setDrawMethod('equilibrado');
            setIsShuffling(false);
            setMatchOngoing(true);
        }, 1500);
    };

    const handleRepetir = () => {
        if (!lastMatchTeams) return;
        setTeamA(lastMatchTeams.teamA);
        setTeamB(lastMatchTeams.teamB);
        setMatchOngoing(true);
    };

    const finishMatch = async (winnerTeam) => {
        const winTeam = winnerTeam === 'A' ? teamA : teamB;
        const lossTeam = winnerTeam === 'A' ? teamB : teamA;
        const teamLabel = winnerTeam === 'A' ? 'Time A' : 'Time B';

        // Efeito de confete temático
        confetti({
            particleCount: 200,
            spread: 80,
            origin: { y: 0.6 },
            colors: winnerTeam === 'A' ? ['#00d2ff', '#ffffff', '#c89b3c'] : ['#ff00ea', '#ffffff', '#c89b3c']
        });

        // Envia o resultado e obtém os pontos (P) ganhos
        const P = await onMatchResult(winTeam, lossTeam);

        // Salva os times atuais para permitir repetição rápida
        setLastMatchTeams({ teamA, teamB });
        
        // Ativa o overlay de comemoração premium
        setCelebrationData({
            winnerTeamName: teamLabel,
            winners: winTeam,
            losers: lossTeam,
            points: P || 20
        });

        // Reseta o estado da partida, mas MANTÉM os IDs selecionados para o próximo jogo
        setMatchOngoing(false);
        setTeamA([]);
        setTeamB([]);
    };

    const submitManualMatch = async () => {
        if (manualWinners.length === 0 || manualLosers.length === 0) return;
        const winners = manualWinners.map(id => players.find(p => p.id === id));
        const losers = manualLosers.map(id => players.find(p => p.id === id));

        confetti({
            particleCount: 150,
            spread: 60,
            origin: { y: 0.6 }
        });

        const P = await onMatchResult(winners, losers);

        setCelebrationData({
            winnerTeamName: 'Ganhadores (Manual)',
            winners: winners,
            losers: losers,
            points: P || 20
        });

        setIsManualMode(false);
        setManualWinners([]);
        setManualLosers([]);
    };

    const cancelMatch = () => {
        setMatchOngoing(false);
        setTeamA([]);
        setTeamB([]);
    };

    const toggleManualPlayer = (id, isWinner) => {
        if (isWinner) {
            if (manualWinners.includes(id)) {
                setManualWinners(manualWinners.filter(pid => pid !== id));
            } else {
                setManualWinners([...manualWinners, id]);
                // Remove do outro lado se estiver
                setManualLosers(manualLosers.filter(pid => pid !== id));
            }
        } else {
            if (manualLosers.includes(id)) {
                setManualLosers(manualLosers.filter(pid => pid !== id));
            } else {
                setManualLosers([...manualLosers, id]);
                // Remove do outro lado
                setManualWinners(manualWinners.filter(pid => pid !== id));
            }
        }
    };

    const getRating = (p) => p.rating !== undefined ? p.rating : (1000 + (p.vitorias - p.derrotas) * 20);
    
    const mmrA = teamA.length > 0 ? Math.round(teamA.reduce((sum, p) => sum + getRating(p), 0) / teamA.length) : 0;
    const mmrB = teamB.length > 0 ? Math.round(teamB.reduce((sum, p) => sum + getRating(p), 0) / teamB.length) : 0;
    
    // Chance de vitória do Time A
    const expA = (mmrB - mmrA) / 800;
    const chanceA = teamA.length > 0 ? (1 / (1 + Math.pow(10, expA)) * 100).toFixed(1) : 0;
    
    // Chance de vitória do Time B
    const expB = (mmrA - mmrB) / 800;
    const chanceB = teamB.length > 0 ? (1 / (1 + Math.pow(10, expB)) * 100).toFixed(1) : 0;

    if (isShuffling) {
        return (
            <section className="matchmaker-section glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                <div className="shuffling-overlay" style={{ width: '100%', border: 'none', background: 'none', marginBottom: 0 }}>
                    <div className="shuffling-card-deck">
                        <div className="shuffling-card card-1">🎲</div>
                        <div className="shuffling-card card-2">⚔️</div>
                        <div className="shuffling-card card-3">🛡️</div>
                    </div>
                    <h3 style={{ color: 'var(--primary-color)', textShadow: '0 0 10px var(--primary-glow)', marginBottom: '0.5rem', fontSize: '1.4rem' }}>Sorteando e Equilibrando Times...</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Calculando MMRs de Runeterra...</p>
                </div>
            </section>
        );
    }

    if (matchOngoing) {
        return (
            <section className="matchmaker-section glass-panel">
                <div className="matchmaker-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <h2>⚔️ Partida em Andamento</h2>
                    {drawMethod && (
                        <span className="draw-method-badge" style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            background: drawMethod === 'equilibrado' ? 'rgba(200, 155, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: drawMethod === 'equilibrado' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.2)',
                            color: drawMethod === 'equilibrado' ? 'var(--primary-color)' : '#ffffff',
                            textShadow: '0 0 10px rgba(0,0,0,0.5)'
                        }}>
                            {drawMethod === 'equilibrado' ? '⚖️ Equilibrado (PDL)' : '🎲 Sorteio Puro'}
                        </span>
                    )}
                </div>
                
                <div className="teams-container">
                    <div className="team team-a">
                        <div className="team-info-header">
                            <h3>Time A</h3>
                            <div className="team-stats">
                                <span className="team-mmr">MMR Médio: {mmrA}</span>
                                <span className="team-chance">Chance: {chanceA}%</span>
                            </div>
                        </div>
                        <ul className="team-list">
                            {teamA.map(p => <li key={p.id}>{p.name} <span className="player-rating-small">({getRating(p)})</span></li>)}
                        </ul>
                        <button className="btn win-btn" onClick={() => finishMatch('A')}>Time A Venceu</button>
                    </div>

                    <div className="vs-badge">VS</div>

                    <div className="team team-b">
                        <div className="team-info-header">
                            <h3>Time B</h3>
                            <div className="team-stats">
                                <span className="team-mmr">MMR Médio: {mmrB}</span>
                                <span className="team-chance">Chance: {chanceB}%</span>
                            </div>
                        </div>
                        <ul className="team-list">
                            {teamB.map(p => <li key={p.id}>{p.name} <span className="player-rating-small">({getRating(p)})</span></li>)}
                        </ul>
                        <button className="btn win-btn" onClick={() => finishMatch('B')}>Time B Venceu</button>
                    </div>
                </div>

                <div className="match-actions" style={{ gap: '1rem' }}>
                    <button className="btn sortear-btn" onClick={() => {
                        const temp = [...teamA];
                        setTeamA([...teamB]);
                        setTeamB(temp);
                    }}>🔄 Inverter Times</button>
                    <button className="btn cancel-btn" onClick={cancelMatch}>Cancelar Partida</button>
                </div>
            </section>
        );
    }

    if (isManualMode) {
        return (
            <section className="matchmaker-section animate-fadeIn">
                <div className="matchmaker-header header-with-btn">
                    <h2>⚙️ Cadastro Manual</h2>
                    <button className="btn cancel-btn" onClick={() => setIsManualMode(false)}>Voltar ao Sorteio</button>
                </div>
                <div className="matchmaker-subtitle">
                    <p>Selecione quem foram os vencedores e quem foram os perdedores desta partida.</p>
                </div>

                <div className="teams-container" style={{ flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                    <div className="team">
                        <h3 style={{ color: 'var(--win-color)' }}>Vencedores</h3>
                        <div className="players-grid" style={{ marginBottom: 0 }}>
                            {players.map(p => (
                                <div key={p.id} className={`player-card ${manualWinners.includes(p.id) ? 'selected' : ''}`} onClick={() => toggleManualPlayer(p.id, true)} style={{ padding: '0.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: 0 }}>{p.name}</h4>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{p.rating || (1000 + (p.vitorias - p.derrotas) * 20)} PDL</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="team">
                        <h3 style={{ color: 'var(--loss-color)' }}>Perdedores</h3>
                        <div className="players-grid" style={{ marginBottom: 0 }}>
                            {players.map(p => (
                                <div key={p.id} className={`player-card ${manualLosers.includes(p.id) ? 'selected-loss' : ''}`} onClick={() => toggleManualPlayer(p.id, false)} style={{ padding: '0.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: 0 }}>{p.name}</h4>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{p.rating || (1000 + (p.vitorias - p.derrotas) * 20)} PDL</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn sortear-btn" 
                        disabled={manualWinners.length === 0 || manualLosers.length === 0}
                        onClick={submitManualMatch}
                    >
                        Salvar Partida
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="matchmaker-section" style={{ position: 'relative' }}>
            {celebrationData && (
                <div className="celebration-overlay">
                    <div className="celebration-content glass-panel">
                        <h1 className="celebration-title">🎉 Vitória de {celebrationData.winnerTeamName}!</h1>
                        <div className="celebration-pdl-counter">
                            <span className="pdl-text">Pontos Distribuídos</span>
                            <span className="pdl-value">+{animatedPdl} PDL</span>
                        </div>
                        <div className="celebration-teams-summary">
                            <div className="celebration-team-col winners">
                                <h3>Vencedores (+{celebrationData.points} PDL)</h3>
                                <ul>
                                    {celebrationData.winners.map(p => (
                                        <li key={p.id}>{p.name}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="celebration-team-col losers">
                                <h3>Perdedores (-{celebrationData.points} PDL)</h3>
                                <ul>
                                    {celebrationData.losers.map(p => (
                                        <li key={p.id}>{p.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <button className="btn win-btn" onClick={() => setCelebrationData(null)} style={{ marginTop: '1rem' }}>
                            Confirmar e Fechar
                        </button>
                    </div>
                </div>
            )}

            <div className="matchmaker-header header-with-btn">
                <h2>🏆 Criar Partida</h2>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    {selectedIds.length > 0 && (
                        <button className="btn cancel-btn" style={{ padding: '0.5rem 1rem' }} onClick={() => setSelectedIds([])}>Limpar</button>
                    )}
                    <button className="btn purple-btn" onClick={() => setIsManualMode(true)}>Manual</button>
                </div>
            </div>

            <div className="matchmaker-subtitle">
                <h3>Selecione os Jogadores para o Sorteio</h3>
                <p>Escolha entre 6 e 10 jogadores, com número par. Clique nos cards para selecionar ou remover.</p>
            </div>

            <div className="players-grid">
                {players.map(player => {
                    const isSelected = selectedIds.includes(player.id);
                    return (
                        <div 
                            key={player.id} 
                            className={`player-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => togglePlayer(player.id)}
                        >
                            <h4>{player.name}</h4>
                            <span className="player-rating">{player.rating || (1000 + (player.vitorias - player.derrotas) * 20)} PDL</span>
                        </div>
                    );
                })}
            </div>

            <div className="selection-status glass-panel">
                <p><strong>Selecionados: {selectedIds.length}</strong></p>
                <p className="status-desc">
                    {selectedIds.length < 6 ? `Faltam pelo menos ${6 - selectedIds.length} jogadores para sortear.` 
                        : selectedIds.length % 2 !== 0 ? 'Selecione um número par de jogadores.' 
                        : 'Pronto para sortear!'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                <button 
                    className="btn sortear-btn" 
                    disabled={selectedIds.length < 6 || selectedIds.length % 2 !== 0}
                    onClick={handleSortear}
                    style={{ flex: 1, minWidth: '160px', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                    🎲 Sorteio Puro
                </button>

                <button 
                    className="btn sortear-btn" 
                    disabled={selectedIds.length < 6 || selectedIds.length % 2 !== 0}
                    onClick={handleSortearEquilibrado}
                    style={{ flex: 1.2, minWidth: '180px', justifyContent: 'center', background: 'var(--primary-color)', color: '#0a0e14', fontWeight: 'bold' }}
                >
                    ⚖️ Sorteio Equilibrado
                </button>

                {lastMatchTeams && (
                    <button 
                        className="btn sortear-btn" 
                        onClick={handleRepetir}
                        style={{ minWidth: '140px', background: 'rgba(200, 155, 60, 0.1)', borderColor: 'var(--primary-color)' }}
                    >
                        🔁 Repetir Última
                    </button>
                )}
            </div>
        </section>
    );
}

export default MatchMaker;
