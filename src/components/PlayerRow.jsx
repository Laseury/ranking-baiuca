import React from 'react';
import Streak from './Streak';

function PlayerRow({ player, index, isOfficial }) {
    const winrateClass = player.winrate >= 50 ? 'winrate-high' : 'winrate-low';
    
    // Calcula um delay para animação em cascata
    const animationDelay = `${index * 0.05}s`;
    
    // Classes especiais de rank (top 3)
    let rankClass = '';
    if (isOfficial && index < 3) {
        rankClass = `rank-${index + 1}`;
    }

    return (
        <tr className={`player-row ${rankClass}`} style={{ animationDelay }}>
            <td className="rank-col">#{index + 1}</td>
            <td className="player-col">{player.name}</td>
            <td>{player.total}</td>
            <td>{player.vitorias}</td>
            <td>{player.derrotas}</td>
            <td className={winrateClass}>{player.winrate}%</td>
            <td className="points-col">{player.pontos} pts</td>
            <td>
                <div className="streak-container">
                    <Streak history={player.streak} />
                </div>
            </td>
        </tr>
    );
}

export default PlayerRow;
