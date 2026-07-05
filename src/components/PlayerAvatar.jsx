import React from 'react';

function PlayerAvatar({ name, elo, style }) {
    const eloClass = elo?.class || 'elo-iron';
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    
    return (
        <div className={`player-avatar-container ${eloClass}`} style={style} title={`${name} (${elo?.name || 'Ferro'})`}>
            <div className="player-avatar-frame">
                <span className="player-avatar-initial">{initial}</span>
            </div>
        </div>
    );
}

export default PlayerAvatar;
