import { getElo } from './elo';

/**
 * Recalculates stats for all players for a specific season from match history.
 */
export function processPlayersBySeason(players, history, selectedSeason) {
    // 1. Initialize stats for all players
    const seasonStats = {};
    players.forEach(p => {
        seasonStats[p.name] = {
            ...p,
            vitorias: 0,
            derrotas: 0,
            total: 0,
            rating: 1000,
            streak: []
        };
    });

    // 2. Filter match history by selected season
    // If match has no season field, assume Season 1
    const seasonMatches = history.filter(m => 
        m.season === selectedSeason || (!m.season && selectedSeason === 'Season 1')
    );

    // 3. Replay matches in chronological order
    [...seasonMatches].sort((a, b) => a.timestamp - b.timestamp).forEach(match => {
        match.winners.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].vitorias++;
                seasonStats[name].total++;
                seasonStats[name].rating += (match.pontosGanhos || 20);
                seasonStats[name].streak = [...(seasonStats[name].streak || []), "W"].slice(-5);
            }
        });
        match.losers.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].derrotas++;
                seasonStats[name].total++;
                seasonStats[name].rating = Math.max(0, seasonStats[name].rating - (match.pontosPerdidos || 20));
                seasonStats[name].streak = [...(seasonStats[name].streak || []), "L"].slice(-5);
            }
        });
    });

    // 4. Compute final winrates and Elo tiers
    return Object.values(seasonStats).map(player => {
        const winrate = player.total > 0 ? ((player.vitorias / player.total) * 100).toFixed(1) : 0;
        const elo = getElo(player.rating);
        return {
            ...player,
            winrate: parseFloat(winrate),
            pontos: player.rating,
            rating: player.rating,
            elo
        };
    });
}

/**
 * Returns players list with correct ratings for the selected season.
 * Season 1 when it is active has migrated points support.
 */
export function getPlayersForSeason(players, history, season, currentSeason) {
    if (season === currentSeason && season === "Season 1") {
        return players.map(p => {
            const winrate = p.total > 0 ? ((p.vitorias / p.total) * 100).toFixed(1) : 0;
            const rating = p.rating !== undefined ? p.rating : (1000 + (p.vitorias - p.derrotas) * 20);
            return {
                ...p,
                winrate: parseFloat(winrate),
                pontos: rating,
                rating: rating,
                elo: getElo(rating)
            };
        });
    } else {
        return processPlayersBySeason(players, history, season);
    }
}

/**
 * Generates options dynamically from Season 1 to the current active season.
 */
export function getSeasonOptions(currentSeason) {
    const currentNum = parseInt(currentSeason.split(' ')[1]) || 1;
    const options = [];
    for (let i = 1; i <= currentNum; i++) {
        options.push(`Season ${i}`);
    }
    return options;
}

/**
 * Calculates ranking trend by comparing current rank with rank before the last match.
 */
export function calculateRankingTrend(players, history, selectedSeason, currentPlayersList) {
    const seasonMatches = history.filter(m => 
        m.season === selectedSeason || (!m.season && selectedSeason === 'Season 1')
    );
    
    if (seasonMatches.length <= 1) {
        return {};
    }
    
    // Sort chronologically and exclude the last match
    const sortedMatches = [...seasonMatches].sort((a, b) => a.timestamp - b.timestamp);
    const previousMatches = sortedMatches.slice(0, -1);
    
    const seasonStats = {};
    players.forEach(p => {
        seasonStats[p.name] = {
            ...p,
            vitorias: 0,
            derrotas: 0,
            total: 0,
            rating: 1000
        };
    });
    
    previousMatches.forEach(match => {
        match.winners.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].vitorias++;
                seasonStats[name].total++;
                seasonStats[name].rating += (match.pontosGanhos || 20);
            }
        });
        match.losers.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].derrotas++;
                seasonStats[name].total++;
                seasonStats[name].rating = Math.max(0, seasonStats[name].rating - (match.pontosPerdidos || 20));
            }
        });
    });
    
    const previousPlayers = Object.values(seasonStats).map(player => {
        const winrate = player.total > 0 ? ((player.vitorias / player.total) * 100).toFixed(1) : 0;
        return {
            ...player,
            winrate: parseFloat(winrate),
            pontos: player.rating
        };
    });
    
    previousPlayers.sort((a, b) => {
        if (b.pontos !== a.pontos) {
            return b.pontos - a.pontos;
        }
        return b.winrate - a.winrate;
    });
    
    const prevOfficial = previousPlayers.filter(p => p.total >= 10);
    const prevProvisional = previousPlayers.filter(p => p.total < 10);
    
    const currentOfficial = currentPlayersList.filter(p => p.total >= 10);
    const currentProvisional = currentPlayersList.filter(p => p.total < 10);
    
    const trends = {};
    
    currentOfficial.forEach((player, currIdx) => {
        const prevIdx = prevOfficial.findIndex(p => p.name === player.name);
        if (prevIdx !== -1) {
            trends[player.name] = prevIdx - currIdx;
        } else {
            trends[player.name] = 0;
        }
    });
    
    currentProvisional.forEach((player, currIdx) => {
        const prevIdx = prevProvisional.findIndex(p => p.name === player.name);
        if (prevIdx !== -1) {
            trends[player.name] = prevIdx - currIdx;
        } else {
            trends[player.name] = 0;
        }
    });
    
    return trends;
}

/**
 * Calculates achievements for a player based on their stats and history.
 */
export function calculateAchievements(player, playersList, history, season) {
    const badges = [];
    if (!player || player.total === 0) return badges;
    
    // 1. Fire Badge: Streak of 3+ wins
    const streak = player.streak || [];
    let currentStreakCount = 0;
    for (let i = streak.length - 1; i >= 0; i--) {
        if (streak[i] === "W") {
            currentStreakCount++;
        } else {
            break;
        }
    }
    if (currentStreakCount >= 3) {
        badges.push({
            id: 'on-fire',
            icon: '🔥',
            name: 'On Fire',
            desc: `Sequência de ${currentStreakCount} vitórias seguidas!`
        });
    }
    
    // 2. Inabalável: Winrate >= 60% and total >= 10
    if (player.winrate >= 60 && player.total >= 10) {
        badges.push({
            id: 'unstoppable',
            icon: '🛡️',
            name: 'Inabalável',
            desc: `Taxa de vitória de ${player.winrate}% com mais de 10 jogos!`
        });
    }
    
    // 3. Maratonista: Most games played in this season
    const activePlayers = playersList.filter(p => p.total > 0);
    if (activePlayers.length > 0) {
        const maxGames = Math.max(...activePlayers.map(p => p.total || 0));
        if (player.total === maxGames) {
            badges.push({
                id: 'marathoner',
                icon: '⚔️',
                name: 'Maratonista',
                desc: 'O guerreiro que mais disputou partidas nesta temporada!'
            });
        }
    }
    
    // 4. Algoz do Líder: Most wins against current MVP (min 2)
    const sortedPlayers = [...playersList].sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        return b.winrate - a.winrate;
    });
    const mvp = sortedPlayers[0];
    
    if (mvp && mvp.name !== player.name) {
        const seasonMatches = history.filter(m => 
            m.season === season || (!m.season && season === 'Season 1')
        );
        
        let playerWinsAgainstMvp = 0;
        seasonMatches.forEach(match => {
            if (match.winners.includes(player.name) && match.losers.includes(mvp.name)) {
                playerWinsAgainstMvp++;
            }
        });
        
        if (playerWinsAgainstMvp >= 2) {
            const winsMap = {};
            playersList.forEach(p => {
                if (p.name !== mvp.name) {
                    let count = 0;
                    seasonMatches.forEach(match => {
                        if (match.winners.includes(p.name) && match.losers.includes(mvp.name)) {
                            count++;
                        }
                    });
                    winsMap[p.name] = count;
                }
            });
            const maxWinsAgainstMvp = Math.max(...Object.values(winsMap), 0);
            
            if (playerWinsAgainstMvp === maxWinsAgainstMvp) {
                badges.push({
                    id: 'mvp-slayer',
                    icon: '🎯',
                    name: 'Algoz do Líder',
                    desc: `Venceu o líder do ranking (${mvp.name}) ${playerWinsAgainstMvp} vezes nesta temporada!`
                });
            }
        }
    }
    
    // 5. Ascendente: Won the last 2 matches
    if (streak.length >= 2 && streak[streak.length - 1] === "W" && streak[streak.length - 2] === "W") {
        badges.push({
            id: 'ascendant',
            icon: '🚀',
            name: 'Ascendente',
            desc: 'Subindo rápido! Ganhou as duas últimas partidas.'
        });
    }
    
    return badges;
}
