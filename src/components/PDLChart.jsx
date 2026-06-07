import React from 'react';

function PDLChart({ history, playerName, season }) {
    // 1. Extract matches for this player in this season
    const seasonMatches = history.filter(m => 
        m.season === season || (!m.season && season === 'Season 1')
    );
    
    // Sort chronologically and filter by player participation
    const playerMatches = [...seasonMatches]
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter(m => m.winners.includes(playerName) || m.losers.includes(playerName));
        
    // 2. Compute PDL progression starting at 1000
    let currentPdl = 1000;
    const dataPoints = [{ pdl: 1000, label: 'Início', result: 'start', change: '' }];
    
    playerMatches.forEach((match, index) => {
        const isWinner = match.winners.includes(playerName);
        if (isWinner) {
            currentPdl += (match.pontosGanhos || 20);
        } else {
            currentPdl = Math.max(0, currentPdl - (match.pontosPerdidos || 20));
        }
        dataPoints.push({
            pdl: currentPdl,
            label: `P.${index + 1}`,
            date: match.date.split(' ')[0],
            result: isWinner ? 'V' : 'D',
            change: isWinner ? `+${match.pontosGanhos || 20}` : `-${match.pontosPerdidos || 20}`
        });
    });
    
    if (dataPoints.length <= 1) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma partida jogada nesta temporada para exibir o gráfico de evolução.
            </div>
        );
    }
    
    // 3. Render custom SVG chart
    const width = 600;
    const height = 250;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const pdls = dataPoints.map(d => d.pdl);
    const maxPdl = Math.max(...pdls, 1200); // at least 1200 max scale
    const minPdl = Math.min(...pdls, 800);  // at least 800 min scale
    const pdlRange = maxPdl - minPdl === 0 ? 100 : maxPdl - minPdl;
    
    // Compute SVG coordinates
    const points = dataPoints.map((d, index) => {
        const x = padding + (index / (dataPoints.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((d.pdl - minPdl) / pdlRange) * chartHeight;
        return { ...d, x, y };
    });
    
    // Create SVG Path strings
    let pathD = '';
    let areaD = `M ${points[0].x} ${padding + chartHeight}`;
    
    points.forEach((p, i) => {
        if (i === 0) {
            pathD += `M ${p.x} ${p.y}`;
        } else {
            // Cubic bezier for smooth curves
            const prev = points[i - 1];
            const cp1x = prev.x + (p.x - prev.x) / 3;
            const cp1y = prev.y;
            const cp2x = prev.x + 2 * (p.x - prev.x) / 3;
            const cp2y = p.y;
            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
        }
        areaD += ` L ${p.x} ${p.y}`;
    });
    
    areaD += ` L ${points[points.length - 1].x} ${padding + chartHeight} Z`;
    
    return (
        <div className="pdl-chart-container glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📈 Evolução de PDL
            </h4>
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{ minWidth: '550px' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                            const yVal = padding + chartHeight * r;
                            const pdlVal = Math.round(maxPdl - r * pdlRange);
                            return (
                                <g key={i}>
                                    <line 
                                        x1={padding} 
                                        y1={yVal} 
                                        x2={width - padding} 
                                        y2={yVal} 
                                        stroke="rgba(255, 255, 255, 0.05)" 
                                        strokeDasharray="4 4"
                                    />
                                    <text 
                                        x={padding - 10} 
                                        y={yVal + 4} 
                                        fill="var(--text-muted)" 
                                        fontSize="10" 
                                        textAnchor="end"
                                        fontFamily="Outfit"
                                    >
                                        {pdlVal}
                                    </text>
                                </g>
                            );
                        })}
                        
                        {/* Glowing Area under line */}
                        <path d={areaD} fill="url(#chartGlow)" />
                        
                        {/* Main Line */}
                        <path 
                            d={pathD} 
                            fill="none" 
                            stroke="var(--primary-color)" 
                            strokeWidth="3" 
                            style={{ filter: 'drop-shadow(0px 0px 8px var(--primary-glow))' }}
                        />
                        
                        {/* Data Point Dots */}
                        {points.map((p, i) => (
                            <g key={i} className="chart-dot-group" style={{ cursor: 'pointer' }}>
                                <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r="4" 
                                    fill={p.result === 'V' ? 'var(--win-color)' : p.result === 'D' ? 'var(--loss-color)' : 'var(--primary-color)'}
                                    stroke="#0a0a0c"
                                    strokeWidth="2"
                                />
                                {/* Hover label tooltips */}
                                <g className="chart-tooltip" style={{ opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
                                    <rect 
                                        x={p.x - 45} 
                                        y={p.y - 35} 
                                        width="90" 
                                        height="25" 
                                        rx="4" 
                                        fill="#091428" 
                                        stroke="var(--primary-color)"
                                        strokeWidth="1"
                                    />
                                    <text 
                                        x={p.x} 
                                        y={p.y - 23} 
                                        fill="#fff" 
                                        fontSize="9" 
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        fontFamily="Outfit"
                                    >
                                        {p.pdl} PDL {p.change ? `(${p.change})` : ''}
                                    </text>
                                </g>
                            </g>
                        ))}
                        
                        {/* X-axis labels */}
                        {points.map((p, i) => {
                            const step = Math.ceil(points.length / 8);
                            if (i % step === 0 || i === points.length - 1) {
                                return (
                                    <text 
                                        key={i} 
                                        x={p.x} 
                                        y={height - padding + 20} 
                                        fill="var(--text-muted)" 
                                        fontSize="10" 
                                        textAnchor="middle"
                                        fontFamily="Outfit"
                                    >
                                        {p.label}
                                    </text>
                                );
                            }
                            return null;
                        })}
                    </svg>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .chart-dot-group:hover .chart-tooltip {
                    opacity: 1 !important;
                }
                .chart-dot-group:hover circle {
                    r: 6px !important;
                }
            `}} />
        </div>
    );
}

export default PDLChart;
