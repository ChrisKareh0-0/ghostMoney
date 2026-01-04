import React, { useState } from 'react';
import Modal from './Modal';

function UserForm({ user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        fullName: user?.full_name || '',
        role: user?.role || 'worker',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords
        if (!user && !formData.password) {
            setError('Password is required for new users');
            setLoading(false);
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const data = {
                username: formData.username,
                fullName: formData.fullName,
                role: formData.role,
                password: formData.password || undefined
            };

            const result = user
                ? await window.electronAPI.updateUser(user.id, data)
                : await window.electronAPI.createUser(data);

            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={user ? 'Edit User' : 'Add New User'}
            footer={
                <>
                    <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                    >
                        <option value="worker">Worker</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        {user ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                        type="password"
                        className="form-input"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!user}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required={!user || formData.password}
                    />
                </div>
            </form>
        </Modal>
    );
}

export default UserForm;
