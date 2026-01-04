import React, { useState, useEffect } from 'react';
import Modal from './Modal';

function PCManager({ onClose, onSuccess }) {
    const [pcs, setPCs] = useState([]);
    const [editingPC, setEditingPC] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPCs();
    }, []);

    const loadPCs = async () => {
        try {
            const result = await window.electronAPI.getPCs();
            if (result.success) {
                setPCs(result.data);
            }
        } catch (error) {
            console.error('Error loading PCs:', error);
        }
    };

    const handleEdit = (pc) => {
        setEditingPC(pc);
        setFormData({
            name: pc.name,
            description: pc.description || '',
            isActive: pc.is_active === 1
        });
    };

    const handleCancelEdit = () => {
        setEditingPC(null);
        setFormData({ name: '', description: '', isActive: true });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = {
                name: formData.name,
                description: formData.description,
                isActive: formData.isActive
            };

            const result = editingPC
                ? await window.electronAPI.updatePC(editingPC.id, data)
                : await window.electronAPI.createPC(data);

            if (result.success) {
                handleCancelEdit();
                loadPCs();
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
        if (!confirm('Are you sure you want to delete this PC? This will also delete all associated reservations.')) {
            return;
        }

        try {
            const result = await window.electronAPI.deletePC(id);
            if (result.success) {
                loadPCs();
            }
        } catch (error) {
            console.error('Error deleting PC:', error);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="PC Management"
            footer={
                <button onClick={onSuccess} className="btn btn-primary">
                    Done
                </button>
            }
        >
            <div>
                {/* Add/Edit Form */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">{editingPC ? 'Edit PC' : 'Add New PC'}</h3>
                    </div>
                    <div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="alert alert-error">{error}</div>}

                            <div className="form-group">
                                <label className="form-label">PC Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., PC-1, VIP-1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Standard Gaming PC"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span>Active (available for reservations)</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingPC && (
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : editingPC ? 'Update' : 'Add PC'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* PC List */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">All PCs ({pcs.length})</h3>
                    </div>
                    <div>
                        {pcs.length === 0 ? (
                            <div className="empty-state">
                                <p>No PCs found</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pcs.map(pc => (
                                            <tr key={pc.id}>
                                                <td style={{ fontWeight: 600 }}>{pc.name}</td>
                                                <td className="text-muted">{pc.description || '-'}</td>
                                                <td>
                                                    <span className={`badge ${pc.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                        {pc.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleEdit(pc)}
                                                            className="btn btn-sm btn-secondary"
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(pc.id)}
                                                            className="btn btn-sm btn-danger"
                                                            title="Delete"
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
            </div>
        </Modal>
    );
}

export default PCManager;
