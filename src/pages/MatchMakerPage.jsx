import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import MatchMaker from '../components/MatchMaker';
import { getPlayersForSeason } from '../utils/season';

function MatchMakerPage() {
    const { players, history, currentSeason, handleMatchResult } = useContext(AppContext);

    const seasonPlayers = useMemo(() => {
        return getPlayersForSeason(players, history, currentSeason, currentSeason);
    }, [players, history, currentSeason]);

    return (
        <div className="fade-in">
            <header>
                <h1>ORGANIZAR <span>PARTIDA</span></h1>
            </header>
            <MatchMaker players={seasonPlayers} currentSeason={currentSeason} onMatchResult={handleMatchResult} />
        </div>
    );
}

export default MatchMakerPage;
