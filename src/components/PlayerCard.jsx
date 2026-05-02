import React from 'react';
import { Link } from 'react-router-dom';
import Streak from './Streak';

function PlayerCard({ player, index, isOfficial }) {
    const winrateClass = player.winrate >= 50 ? 'winrate-high' : 'winrate-low';
    const animationDelay = `${index * 0.05}s`;
    
    let rankClass = '';
    if (isOfficial && index < 3) {
        rankClass = `rank-${index + 1}`;
    }

    return (
        <div className={`player-card-mobile glass-panel ${rankClass}`} style={{ animationDelay }}>
            <div className="card-mobile-header">
                <span className="rank-col">#{index + 1}</span>
                <Link to={`/player/${player.name}`} className="player-link">
                    {player.name}
                </Link>
                <span className={`elo-badge ${player.elo?.class || 'elo-iron'}`}>
                    {player.elo?.icon || '⚙️'} {player.elo?.name || 'Ferro'}
                </span>
            </div>
            
            <div className="card-mobile-stats">
                <div className="stat-item">
                    <span className="label">PDL</span>
                    <span className="value points-col">{player.pontos}</span>
                </div>
                <div className="stat-item">
                    <span className="label">VITÓRIAS</span>
                    <span className="value winrate-high">{player.vitorias}</span>
                </div>
                <div className="stat-item">
                    <span className="label">WINRATE</span>
                    <span className={`value ${winrateClass}`}>{player.winrate}%</span>
                </div>
                <div className="stat-item">
                    <span className="label">TOTAL</span>
                    <span className="value">{player.total}</span>
                </div>
            </div>
            
            <div className="card-mobile-footer">
                <div className="streak-container">
                    <Streak history={player.streak} />
                </div>
            </div>
        </div>
    );
}

export default PlayerCard;
