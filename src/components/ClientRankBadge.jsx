import React, { useState, useEffect } from 'react';

function ClientRankBadge({ totalPoints, showProgress = false }) {
    const [rankInfo, setRankInfo] = useState(null);

    useEffect(() => {
        loadRankInfo();
    }, [totalPoints]);

    const loadRankInfo = async () => {
        try {
            const result = await window.electronAPI.getClientRankInfo(totalPoints || 0);
            if (result.success) {
                setRankInfo(result.data);
            }
        } catch (error) {
            console.error('Error loading rank info:', error);
        }
    };

    if (!rankInfo) return null;

    const { currentRank, nextRank } = rankInfo;
    const points = totalPoints || 0;

    // Calculate progress to next rank
    let progress = 100;
    let pointsToNext = 0;
    if (nextRank) {
        const currentMin = currentRank?.min_points || 0;
        const nextMin = nextRank.min_points;
        const range = nextMin - currentMin;
        const earned = points - currentMin;
        progress = Math.min(100, (earned / range) * 100);
        pointsToNext = nextMin - points;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Rank Badge */}
                {currentRank && (
                    <span
                        style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: (currentRank.color || '#808080') + '30',
                            border: `1px solid ${currentRank.color || '#808080'}`,
                            color: currentRank.color || '#808080',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {currentRank.name}
                    </span>
                )}
                
                {/* Points Display */}
                <span style={{ fontSize: '0.85rem', color: 'var(--green-primary)', fontWeight: 600 }}>
                    👻 {points.toLocaleString()} GP
                </span>

                {/* Discount Badge */}
                {currentRank && currentRank.discount_percent > 0 && (
                    <span
                        style={{
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--success-color)',
                            color: '#000',
                            fontSize: '0.7rem',
                            fontWeight: 700
                        }}
                    >
                        -{currentRank.discount_percent}%
                    </span>
                )}
            </div>

            {/* Progress Bar (optional) */}
            {showProgress && nextRank && (
                <div style={{ marginTop: '0.25rem' }}>
                    <div
                        style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}
                    >
                        <div
                            style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: nextRank.color || 'var(--green-primary)',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {pointsToNext.toLocaleString()} GP to {nextRank.name}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientRankBadge;
