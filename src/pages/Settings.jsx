import React, { useState, useEffect } from 'react';
import RankManager from '../components/RankManager';

function Settings({ user }) {
    const [showRankManager, setShowRankManager] = useState(false);
    const [ranks, setRanks] = useState([]);
    const [dbInfo, setDbInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [ranksResult, dbResult] = await Promise.all([
                window.electronAPI.getRanks(),
                window.electronAPI.getDatabaseInfo()
            ]);
            if (ranksResult.success) setRanks(ranksResult.data);
            if (dbResult.success) setDbInfo(dbResult.data);
        } catch (error) {
            console.error('Error loading settings data:', error);
        }
    };

    const handleBackup = async () => {
        setLoading(true);
        try {
            const result = await window.electronAPI.backupDatabase();
            if (result.success) {
                alert(`Backup created successfully!\n\nSaved to: ${result.filePath}`);
            } else {
                alert('Backup failed: ' + result.error);
            }
        } catch (error) {
            alert('Backup failed');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1>⚙️ Settings</h1>
                <p className="text-muted">Configure your GhostMoney system</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* GhostPoints Configuration */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">👻 GhostPoints System</h3>
                    </div>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Configure loyalty ranks and rewards for your clients
                        </p>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                CURRENT RANKS
                            </h4>
                            {ranks.length === 0 ? (
                                <p className="text-muted">No ranks configured</p>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {ranks.map(rank => (
                                        <span
                                            key={rank.id}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                backgroundColor: rank.color + '20',
                                                border: `1px solid ${rank.color}`,
                                                color: rank.color,
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            {rank.name} ({rank.min_points}+ GP)
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setShowRankManager(true)} 
                            className="btn btn-primary"
                        >
                            🏆 Manage Ranks
                        </button>
                    </div>
                </div>

                {/* Database Info */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">💾 Database</h3>
                    </div>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Database information and backup
                        </p>

                        {dbInfo && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <div>
                                        <span className="text-muted">Size: </span>
                                        <span style={{ fontWeight: 600 }}>{formatBytes(dbInfo.size)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted">Last Modified: </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {new Date(dbInfo.modified).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ wordBreak: 'break-all' }}>
                                        <span className="text-muted">Location: </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {dbInfo.path}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleBackup} 
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            {loading ? 'Creating Backup...' : '📥 Create Backup'}
                        </button>
                    </div>
                </div>

                {/* How Points Work */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📖 How GhostPoints Work</h3>
                    </div>
                    <div>
                        <ol style={{ lineHeight: 2, paddingLeft: '1.25rem' }}>
                            <li>Set <strong>GhostPoints</strong> value for each product in Products page</li>
                            <li>When a client makes a purchase, points are automatically added</li>
                            <li>Clients are assigned ranks based on their total points</li>
                            <li>Higher ranks get <strong>automatic discounts</strong> at checkout</li>
                            <li>Configure rank names, thresholds, and discounts using Manage Ranks</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Rank Manager Modal */}
            {showRankManager && (
                <RankManager
                    onClose={() => setShowRankManager(false)}
                    onSuccess={() => {
                        setShowRankManager(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

export default Settings;
