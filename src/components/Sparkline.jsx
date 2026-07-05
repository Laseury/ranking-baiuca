import React from 'react';

function Sparkline({ history }) {
    if (!history || history.length < 2) {
        return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem dados</span>;
    }
    
    // We only take the last 6 values to show a neat trend of the recent games
    const data = history.slice(-6);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    // SVG width & height
    const width = 80;
    const height = 24;
    const padding = 2;
    
    // Map points to SVG coordinates
    const points = data.map((val, idx) => {
        const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
        const y = padding + (1 - (val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    const lastVal = data[data.length - 1];
    const prevVal = data[data.length - 2];
    const isUp = lastVal >= prevVal;
    const strokeColor = isUp ? '#00e676' : '#ff1744'; // green or red
    const gradientId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={width} height={height} style={{ overflow: 'visible', verticalAlign: 'middle' }} title={`Evolução recente de PDL: ${data.join(' → ')}`}>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Area path */}
            <path
                d={`M ${padding},${height} L ${points} L ${width - padding},${height} Z`}
                fill={`url(#${gradientId})`}
            />
            {/* Trend line */}
            <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                points={points}
            />
            {/* Last point indicator */}
            {data.length > 0 && (
                <circle
                    cx={padding + (data.length - 1) / (data.length - 1) * (width - padding * 2)}
                    cy={padding + (1 - (lastVal - min) / range) * (height - padding * 2)}
                    r="2.5"
                    fill={strokeColor}
                />
            )}
        </svg>
    );
}

export default Sparkline;
