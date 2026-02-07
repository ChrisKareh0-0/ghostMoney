import React, { useState, useEffect } from 'react';
import Modal from './Modal';

function RankManager({ onClose, onSuccess }) {
    const [ranks, setRanks] = useState([]);
    const [editingRank, setEditingRank] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        minPoints: '',
        discountPercent: '',
        color: '#00ff41',
        sortOrder: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadRanks();
    }, []);

    const loadRanks = async () => {
        try {
            const result = await window.electronAPI.getRanks();
            if (result.success) {
                setRanks(result.data);
            }
        } catch (error) {
            console.error('Error loading ranks:', error);
        }
    };

    const handleEdit = (rank) => {
        setEditingRank(rank);
        setFormData({
            name: rank.name,
            minPoints: rank.min_points,
            discountPercent: rank.discount_percent,
            color: rank.color || '#00ff41',
            sortOrder: rank.sort_order
        });
    };

    const handleCancelEdit = () => {
        setEditingRank(null);
        setFormData({
            name: '',
            minPoints: '',
            discountPercent: '',
            color: '#00ff41',
            sortOrder: ranks.length + 1
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = {
                name: formData.name,
                minPoints: parseInt(formData.minPoints),
                discountPercent: parseFloat(formData.discountPercent) || 0,
                color: formData.color,
                sortOrder: parseInt(formData.sortOrder) || ranks.length + 1
            };

            if (data.minPoints < 0) {
                setError('Minimum points cannot be negative');
                setLoading(false);
                return;
            }

            if (data.discountPercent < 0 || data.discountPercent > 100) {
                setError('Discount must be between 0 and 100');
                setLoading(false);
                return;
            }

            const result = editingRank
                ? await window.electronAPI.updateRank(editingRank.id, data)
                : await window.electronAPI.createRank(data);

            if (result.success) {
                handleCancelEdit();
                loadRanks();
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rank?')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteRank(id);
            if (result.success) {
                loadRanks();
            }
        } catch (error) {
            console.error('Error deleting rank:', error);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="👻 GhostPoints Rank Management"
            footer={
                <button onClick={onSuccess || onClose} className="btn btn-primary">
                    Done
                </button>
            }
        >
            <div>
                {/* Add/Edit Form */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">{editingRank ? 'Edit Rank' : 'Add New Rank'}</h3>
                    </div>
                    <div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="alert alert-error">{error}</div>}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Rank Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Gold, Diamond"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Minimum Points *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        value={formData.minPoints}
                                        onChange={(e) => setFormData({ ...formData, minPoints: e.target.value })}
                                        placeholder="Points to reach this rank"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Discount % *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        className="form-input"
                                        value={formData.discountPercent}
                                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                                        placeholder="Discount percentage"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Color</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            style={{ width: '50px', height: '38px', padding: '2px', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                {editingRank && (
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : editingRank ? 'Update Rank' : 'Add Rank'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Ranks List */}
                <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--green-primary)' }}>
                        Current Ranks ({ranks.length})
                    </h4>
                    {ranks.length === 0 ? (
                        <p className="text-muted">No ranks configured. Add your first rank above!</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Min Points</th>
                                        <th>Discount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranks.map(rank => (
                                        <tr key={rank.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%',
                                                            backgroundColor: rank.color || '#00ff41',
                                                            boxShadow: `0 0 8px ${rank.color || '#00ff41'}`
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: 600, color: rank.color || 'inherit' }}>
                                                        {rank.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{rank.min_points.toLocaleString()} GP</td>
                                            <td className="text-success">{rank.discount_percent}%</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleEdit(rank)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(rank.id)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default RankManager;
