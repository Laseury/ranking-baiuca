import React, { useState } from 'react';

function MatchMaker({ players, onMatchResult }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [teamA, setTeamA] = useState([]);
    const [teamB, setTeamB] = useState([]);
    const [matchOngoing, setMatchOngoing] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    
    // Estados do Modo Manual
    const [manualWinners, setManualWinners] = useState([]);
    const [manualLosers, setManualLosers] = useState([]);

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

        // Shuffle
        const shuffled = [...selectedIds].sort(() => 0.5 - Math.random());
        
        const half = Math.floor(shuffled.length / 2);
        const tA = shuffled.slice(0, half).map(id => players.find(p => p.id === id));
        const tB = shuffled.slice(half).map(id => players.find(p => p.id === id));

        setTeamA(tA);
        setTeamB(tB);
        setMatchOngoing(true);
    };

    const finishMatch = (winnerTeam) => {
        if (winnerTeam === 'A') {
            onMatchResult(teamA, teamB);
        } else if (winnerTeam === 'B') {
            onMatchResult(teamB, teamA);
        }
        // Reset state
        setMatchOngoing(false);
        setTeamA([]);
        setTeamB([]);
        setSelectedIds([]);
    };

    const submitManualMatch = () => {
        if (manualWinners.length === 0 || manualLosers.length === 0) return;
        const winners = manualWinners.map(id => players.find(p => p.id === id));
        const losers = manualLosers.map(id => players.find(p => p.id === id));
        onMatchResult(winners, losers);
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

    if (matchOngoing) {
        return (
            <section className="matchmaker-section glass-panel">
                <div className="matchmaker-header">
                    <h2>⚔️ Partida em Andamento</h2>
                </div>
                
                <div className="teams-container">
                    <div className="team team-a">
                        <h3>Time A</h3>
                        <ul className="team-list">
                            {teamA.map(p => <li key={p.id}>{p.name}</li>)}
                        </ul>
                        <button className="btn win-btn" onClick={() => finishMatch('A')}>Time A Venceu</button>
                    </div>

                    <div className="vs-badge">VS</div>

                    <div className="team team-b">
                        <h3>Time B</h3>
                        <ul className="team-list">
                            {teamB.map(p => <li key={p.id}>{p.name}</li>)}
                        </ul>
                        <button className="btn win-btn" onClick={() => finishMatch('B')}>Time B Venceu</button>
                    </div>
                </div>

                <div className="match-actions">
                    <button className="btn cancel-btn" onClick={cancelMatch}>Cancelar Partida</button>
                </div>
            </section>
        );
    }

    if (isManualMode) {
        return (
            <section className="matchmaker-section">
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
        <section className="matchmaker-section">
            <div className="matchmaker-header header-with-btn">
                <h2>🏆 Criar Partida</h2>
                <button className="btn purple-btn" onClick={() => setIsManualMode(true)}>Cadastrar Manual</button>
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

            <button 
                className="btn sortear-btn" 
                disabled={selectedIds.length < 6 || selectedIds.length % 2 !== 0}
                onClick={handleSortear}
            >
                🎲 Sortear Times
            </button>
        </section>
    );
}

export default MatchMaker;
