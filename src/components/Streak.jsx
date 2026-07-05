import React from 'react';

function Streak({ history }) {
    const recentHistory = history.slice(-5);
    
    return (
        <>
            {recentHistory.map((result, idx) => (
                <div 
                    key={idx} 
                    className={`streak-box ${result === 'W' ? 'streak-w' : 'streak-l'}`}
                >
                    {result === 'W' ? 'V' : 'D'}
                </div>
            ))}
        </>
    );
}

export default Streak;
