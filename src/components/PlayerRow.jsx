import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Streak from './Streak';
import PlayerAvatar from './PlayerAvatar';
import Sparkline from './Sparkline';
import { AppContext } from '../context/AppContext';
import { calculateAchievements } from '../utils/season';

function PlayerRow({ player, index, isOfficial, trend, playersList }) {
    const { history, currentSeason } = useContext(AppContext);
    const winrateClass = player.winrate >= 50 ? 'winrate-high' : 'winrate-low';
    
    // Calculates visual delay for cascade animation
    const animationDelay = `${index * 0.05}s`;
    
    // Special rank classes for top 3
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
        <tr className={`player-row ${rankClass}`} style={{ animationDelay }}>
            <td className="rank-col">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                    {renderTrend()}
                    <span>#{index + 1}</span>
                </div>
            </td>
            <td className="player-col">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <PlayerAvatar name={player.name} elo={player.elo} />
                    <span className={`elo-badge ${player.elo?.class || 'elo-iron'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                        {player.elo?.icon || '⚙️'} {player.elo?.name || 'Ferro'}
                    </span>
                    <Link to={`/player/${player.name}`} className="player-link">
                        {player.name}
                    </Link>
                    <div style={{ display: 'inline-flex', gap: '0.3rem', marginLeft: '0.3rem' }}>
                        {badges.map(badge => (
                            <span key={badge.id} className="achievement-badge" title={`${badge.name}: ${badge.desc}`} style={{ cursor: 'help' }}>
                                {badge.icon}
                            </span>
                        ))}
                    </div>
                </div>
            </td>
            <td>{player.total}</td>
            <td>{player.vitorias}</td>
            <td>{player.derrotas}</td>
            <td className={winrateClass}>{player.winrate}%</td>
            <td className="points-col">{player.pontos} PDL</td>
            <td className="sparkline-col">
                <Sparkline history={player.ratingHistory} />
            </td>
            <td>
                <div className="streak-container">
                    <Streak history={player.streak} />
                </div>
            </td>
        </tr>
    );
}

export default PlayerRow;
