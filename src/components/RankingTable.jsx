import React from 'react';
import PlayerRow from './PlayerRow';

function RankingTable({ players, isOfficial }) {
    if (players.length === 0) {
        return <div className="empty-state">Nenhum jogador nesta categoria.</div>;
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
