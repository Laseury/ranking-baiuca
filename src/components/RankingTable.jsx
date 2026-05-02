import React from 'react';
import PlayerRow from './PlayerRow';
import PlayerCard from './PlayerCard';

function RankingTable({ players, isOfficial, isMobileView }) {
    if (players.length === 0) {
        return <div className="empty-state">Nenhum jogador nesta categoria.</div>;
    }

    if (isMobileView) {
        return (
            <div className="player-cards-grid">
                {players.map((player, index) => (
                    <PlayerCard 
                        key={player.id} 
                        player={player} 
                        index={index} 
                        isOfficial={isOfficial} 
                    />
                ))}
            </div>
        );
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Jogador</th>
                    <th>Total</th>
                    <th>Vitórias</th>
                    <th>Derrotas</th>
                    <th>Winrate</th>
                    <th>Pontos</th>
                    <th>Sequência</th>
                </tr>
            </thead>
            <tbody>
                {players.map((player, index) => (
                    <PlayerRow 
                        key={player.id} 
                        player={player} 
                        index={index} 
                        isOfficial={isOfficial} 
                    />
                ))}
            </tbody>
        </table>
    );
}

export default RankingTable;
