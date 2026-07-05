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
            streak: [],
            ratingHistory: [1000]
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
                seasonStats[name].ratingHistory.push(seasonStats[name].rating);
            }
        });
        match.losers.forEach(name => {
            if (seasonStats[name]) {
                seasonStats[name].derrotas++;
                seasonStats[name].total++;
                seasonStats[name].rating = Math.max(0, seasonStats[name].rating - (match.pontosPerdidos || 20));
                seasonStats[name].streak = [...(seasonStats[name].streak || []), "L"].slice(-5);
                seasonStats[name].ratingHistory.push(seasonStats[name].rating);
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
        const processed = processPlayersBySeason(players, history, "Season 1");
        return players.map(p => {
            const winrate = p.total > 0 ? ((p.vitorias / p.total) * 100).toFixed(1) : 0;
            const rating = p.rating !== undefined ? p.rating : (1000 + (p.vitorias - p.derrotas) * 20);
            const procPlayer = processed.find(x => x.name === p.name);
            return {
                ...p,
                winrate: parseFloat(winrate),
                pontos: rating,
                rating: rating,
                elo: getElo(rating),
                ratingHistory: procPlayer ? procPlayer.ratingHistory : [1000]
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
    
    const streak = player.streak || [];
    
    // 1. Soberano: Rank #1 in official players list
    const officialSorted = [...playersList]
        .filter(p => p.total >= 10)
        .sort((a, b) => {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos;
            return b.winrate - a.winrate;
        });
    const rank1Player = officialSorted[0];
    if (rank1Player && rank1Player.name === player.name) {
        badges.push({
            id: 'sovereign',
            icon: '👑',
            name: 'Soberano',
            desc: 'Líder atual do ranking oficial!'
        });
    }

    // 2. Fire & Imbatível Badge
    let currentStreakCount = 0;
    for (let i = streak.length - 1; i >= 0; i--) {
        if (streak[i] === "W") {
            currentStreakCount++;
        } else {
            break;
        }
    }
    if (currentStreakCount >= 5) {
        badges.push({
            id: 'invincible',
            icon: '⚡',
            name: 'Imbatível',
            desc: `Sequência incrível de ${currentStreakCount} vitórias seguidas!`
        });
    } else if (currentStreakCount >= 3) {
        badges.push({
            id: 'on-fire',
            icon: '🔥',
            name: 'On Fire',
            desc: `Sequência de ${currentStreakCount} vitórias seguidas!`
        });
    }
    
    // 3. Saco de Pancadas Badge
    let currentLossStreak = 0;
    for (let i = streak.length - 1; i >= 0; i--) {
        if (streak[i] === "L") {
            currentLossStreak++;
        } else {
            break;
        }
    }
    if (currentLossStreak >= 3) {
        badges.push({
            id: 'punching-bag',
            icon: '🤕',
            name: 'Saco de Pancadas',
            desc: `Sequência de ${currentLossStreak} derrotas seguidas. Dias melhores virão!`
        });
    }

    // 4. Inabalável: Winrate >= 60% and total >= 10
    if (player.winrate >= 60 && player.total >= 10) {
        badges.push({
            id: 'unstoppable',
            icon: '🛡️',
            name: 'Inabalável',
            desc: `Taxa de vitória de ${player.winrate}% com mais de 10 jogos!`
        });
    }
    
    // 5. Maratonista: Most games played in this season
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
    
    // 6. Veterano: total matches >= 20
    if (player.total >= 20) {
        badges.push({
            id: 'veteran',
            icon: '🧙‍♂️',
            name: 'Veterano',
            desc: `Disputou ${player.total} partidas nesta temporada!`
        });
    }

    // 7. Algoz do Líder: Most wins against current MVP (min 2)
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
    
    // 8. Ascendente: Won the last 2 matches
    if (streak.length >= 2 && streak[streak.length - 1] === "W" && streak[streak.length - 2] === "W") {
        badges.push({
            id: 'ascendant',
            icon: '🚀',
            name: 'Ascendente',
            desc: 'Subindo rápido! Ganhou as duas últimas partidas.'
        });
    }

    // 9. Promessa: provisional player with WR >= 60% and WR < 80% and total >= 3
    if (player.total < 10 && player.total >= 3 && player.winrate >= 60 && player.winrate < 80) {
        badges.push({
            id: 'promise',
            icon: '🌱',
            name: 'Promessa',
            desc: `Taxa de vitória de ${player.winrate}% em ${player.total} jogos!`
        });
    }

    // 10. Pé Frio: official player with WR < 35%
    if (player.total >= 10 && player.winrate < 35) {
        badges.push({
            id: 'cold-foot',
            icon: '❄️',
            name: 'Pé Frio',
            desc: `Taxa de vitória de ${player.winrate}% em ${player.total} jogos. Fase difícil!`
        });
    }

    // 11. Carrasco: Winrate >= 70% and total >= 5
    if (player.winrate >= 70 && player.total >= 5) {
        badges.push({
            id: 'carrasco',
            icon: '🩸',
            name: 'Carrasco',
            desc: `Taxa de vitória implacável de ${player.winrate}% em ${player.total} partidas!`
        });
    }

    // 12. Muralha: total >= 10 and derrotas <= 4
    if (player.total >= 10 && player.derrotas <= 4) {
        badges.push({
            id: 'wall',
            icon: '🧱',
            name: 'Muralha',
            desc: `Defesa impenetrável: disputou ${player.total} partidas e sofreu apenas ${player.derrotas} derrotas!`
        });
    }

    // 13. Curinga: played with 5 or more different teammates
    const activeSeasonMatches = history.filter(m => 
        m.season === season || (!m.season && season === 'Season 1')
    );
    const teammates = new Set();
    activeSeasonMatches.forEach(match => {
        if (match.winners.includes(player.name)) {
            match.winners.forEach(w => {
                if (w !== player.name) teammates.add(w);
            });
        } else if (match.losers.includes(player.name)) {
            match.losers.forEach(l => {
                if (l !== player.name) teammates.add(l);
            });
        }
    });
    if (teammates.size >= 5) {
        badges.push({
            id: 'joker',
            icon: '🃏',
            name: 'Curinga',
            desc: `Jogou com ${teammates.size} parceiros de equipe diferentes nesta temporada!`
        });
    }

    // 14. Smurf: provisional player with WR >= 80% and total >= 3
    if (player.total < 10 && player.total >= 3 && player.winrate >= 80) {
        badges.push({
            id: 'smurf',
            icon: '⚡🌱',
            name: 'Smurf',
            desc: `Desempenho avassalador de ${player.winrate}% em apenas ${player.total} jogos!`
        });
    }

    // 15. Divino: rating >= 1200
    if (player.pontos >= 1200) {
        badges.push({
            id: 'divine',
            icon: '🌌',
            name: 'Divino',
            desc: `Alcançou o patamar celestial com ${player.pontos} PDL!`
        });
    }

    // 16. Carregador: total >= 15 and WR >= 65
    if (player.total >= 15 && player.winrate >= 65) {
        badges.push({
            id: 'carry',
            icon: '🎒',
            name: 'Carregador',
            desc: `Carregou o piano! Winrate de ${player.winrate}% em ${player.total} jogos.`
        });
    }

    // 17. Filho do Vazio: currentLossStreak >= 5
    if (currentLossStreak >= 5) {
        badges.push({
            id: 'void-child',
            icon: '👾',
            name: 'Filho do Vazio',
            desc: `Sequência de ${currentLossStreak} derrotas seguidas... O abismo te abraçou.`
        });
    }

    // 18. Espírito Inquebrável: total >= 30
    if (player.total >= 30) {
        badges.push({
            id: 'unbreakable',
            icon: '🛡️',
            name: 'Espírito Inquebrável',
            desc: `Inabalável na jornada! Disputou ${player.total} partidas nesta temporada.`
        });
    }

    // 19. Gladiador: vitorias >= 12
    if (player.vitorias >= 12) {
        badges.push({
            id: 'gladiator',
            icon: '⚔️',
            name: 'Gladiador',
            desc: `Guerreiro de arena: conquistou ${player.vitorias} vitórias nesta temporada!`
        });
    }

    // 20. Destruidor: vitorias >= 15
    if (player.vitorias >= 15) {
        badges.push({
            id: 'destroyer',
            icon: '💥',
            name: 'Destruidor',
            desc: `Deixou apenas cinzas: somou ${player.vitorias} vitórias na temporada!`
        });
    }

    // 21. Lanterna Vermelha: official player with lowest PDL
    if (player.total >= 10) {
        const officialPlayers = playersList.filter(p => p.total >= 10);
        if (officialPlayers.length > 0) {
            const minPoints = Math.min(...officialPlayers.map(p => p.pontos));
            if (player.pontos === minPoints) {
                badges.push({
                    id: 'lantern',
                    icon: '🏮',
                    name: 'Lanterna Vermelha',
                    desc: 'Lanterna do campeonato. Só resta subir!'
                });
            }
        }
    }

    // 22. Invocador Lendário: points >= 1800
    if (player.pontos >= 1800) {
        badges.push({
            id: 'legendary-summoner',
            icon: '🐉',
            name: 'Invocador Lendário',
            desc: `Alcançou o patamar de Mestre+ com ${player.pontos} PDL!`
        });
    }

    // 23. Equilíbrio Perfeito: total >= 10 and WR === 50
    if (player.total >= 10 && player.winrate === 50) {
        badges.push({
            id: 'perfect-balance',
            icon: '☯️',
            name: 'Equilíbrio Perfeito',
            desc: 'Equilíbrio absoluto: 50% de vitórias e 50% de derrotas.'
        });
    }

    // 24. General da Baiuca: most wins in season
    const winsActivePlayers = playersList.filter(p => p.total > 0);
    if (winsActivePlayers.length > 0) {
        const maxWins = Math.max(...winsActivePlayers.map(p => p.vitorias || 0));
        if (player.vitorias === maxWins && player.vitorias > 0) {
            badges.push({
                id: 'general',
                icon: '🎖️',
                name: 'General da Baiuca',
                desc: `Líder militar da temporada com o recorde de ${player.vitorias} vitórias!`
            });
        }
    }

    // 25. Colecionador: has 4 or more other badges
    if (badges.length >= 4) {
        badges.push({
            id: 'collector',
            icon: '💎',
            name: 'Colecionador',
            desc: `Ostentando prestígio! Possui ${badges.length} títulos ativos simultaneamente.`
        });
    }
    
    return badges;
}

/**
 * Calculates active synergies (positive or negative) between pairs of players in a given team list.
 * A positive synergy is when they win >= 60% of games played together (min 2 games).
 * A negative synergy is when they win <= 35% of games played together (min 2 games).
 */
export function calculateTeamSynergies(history, teamList, season) {
    if (!teamList || teamList.length < 2) return [];
    const pairs = [];
    const activeSeason = season || 'Season 1';
    
    // Filter matches by season
    const seasonMatches = history.filter(m => 
        m.season === activeSeason || (!m.season && activeSeason === 'Season 1')
    );
    
    // Check all pairs in the team list
    for (let i = 0; i < teamList.length; i++) {
        for (let j = i + 1; j < teamList.length; j++) {
            const p1 = teamList[i];
            const p2 = teamList[j];
            
            let gamesTogether = 0;
            let winsTogether = 0;
            
            seasonMatches.forEach(m => {
                const p1Win = m.winners.includes(p1);
                const p2Win = m.winners.includes(p2);
                const p1Loss = m.losers.includes(p1);
                const p2Loss = m.losers.includes(p2);
                
                if (p1Win && p2Win) {
                    gamesTogether++;
                    winsTogether++;
                } else if (p1Loss && p2Loss) {
                    gamesTogether++;
                }
            });
            
            if (gamesTogether >= 2) {
                const wr = (winsTogether / gamesTogether) * 100;
                if (wr >= 60.0) {
                    pairs.push({ p1, p2, wr, type: 'good' });
                } else if (wr <= 35.0) {
                    pairs.push({ p1, p2, wr, type: 'bad' });
                }
            }
        }
    }
    return pairs;
}
