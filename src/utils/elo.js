export const getElo = (rating) => {
    if (rating >= 2100) return { name: 'Challenger', class: 'elo-challenger', icon: '🏆' };
    if (rating >= 1801) return { name: 'Mestre', class: 'elo-master', icon: '👑' };
    if (rating >= 1501) return { name: 'Diamante', class: 'elo-diamond', icon: '💎' };
    if (rating >= 1351) return { name: 'Esmeralda', class: 'elo-emerald', icon: '✳️' };
    if (rating >= 1201) return { name: 'Platina', class: 'elo-platinum', icon: '💠' };
    if (rating >= 1051) return { name: 'Ouro', class: 'elo-gold', icon: '🥇' };
    if (rating >= 901) return { name: 'Prata', class: 'elo-silver', icon: '🥈' };
    if (rating >= 751) return { name: 'Bronze', class: 'elo-bronze', icon: '🥉' };
    return { name: 'Ferro', class: 'elo-iron', icon: '⚙️' };
};
