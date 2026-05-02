import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import MatchMaker from '../components/MatchMaker';

function MatchMakerPage() {
    const { players, handleMatchResult } = useContext(AppContext);

    return (
        <div className="fade-in">
            <header>
                <h1>ORGANIZAR <span>PARTIDA</span></h1>
            </header>
            <MatchMaker players={players} onMatchResult={handleMatchResult} />
        </div>
    );
}

export default MatchMakerPage;
