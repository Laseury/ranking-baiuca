import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Streak from './Streak';
import PlayerAvatar from './PlayerAvatar';
import Sparkline from './Sparkline';
import { AppContext } from '../context/AppContext';
import { calculateAchievements } from '../utils/season';

function PlayerCard({ player, index, isOfficial, trend, playersList }) {
    const { history, currentSeason } = useContext(AppContext);
    const winrateClass = player.winrate >= 50 ? 'winrate-high' : 'winrate-low';
    const animationDelay = `${index * 0.05}s`;
    
    let rankClass = '';
    if (isOfficial && index < 3) {
        rankClass = `rank-${index + 1}`;
    }

    const badges = calculateAchievements(player, playersList, history, currentSeason);

    const renderTrend = () => {
        if (!trend || trend === 0) return <span className="trend-no-change" title="Sem alteração de posição">➖</span>;
        if (trend > 0) return <span className="trend-up" title={`Subiu ${trend} posições`}>▲ {trend}</span>;
        return <span className="trend-down" title={`Desceu ${Math.abs(trend)} posições`}>▼ {Math.abs(trend)}</span>;
    };

    return (
        <div className={`player-card-mobile glass-panel ${rankClass}`} style={{ animationDelay }}>
            <div className="card-mobile-header">
                <span className="rank-col" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {renderTrend()} #{index + 1}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <PlayerAvatar name={player.name} elo={player.elo} style={{ width: '28px', height: '28px' }} />
                    <Link to={`/player/${player.name}`} className="player-link">
                        {player.name}
                    </Link>
                    <div style={{ display: 'inline-flex', gap: '0.2rem' }}>
                        {badges.map(badge => (
                            <span key={badge.id} className="achievement-badge" title={`${badge.name}: ${badge.desc}`} style={{ cursor: 'help' }}>
                                {badge.icon}
                            </span>
                        ))}
                    </div>
                </div>
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
            
            <div className="card-mobile-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="streak-container">
                    <Streak history={player.streak} />
                </div>
                <div className="card-mobile-sparkline" style={{ display: 'flex', alignItems: 'center' }}>
                    <Sparkline history={player.ratingHistory} />
                </div>
            </div>
        </div>
    );
}

export default PlayerCard;
