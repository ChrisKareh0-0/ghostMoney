import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';

function Users({ user }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const result = await window.electronAPI.getUsers();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = () => {
        setSelectedUser(null);
        setShowUserForm(true);
    };

    const handleEditUser = (userToEdit) => {
        setSelectedUser(userToEdit);
        setShowUserForm(true);
    };

    const handleDeleteUser = async (id) => {
        if (id === user.id) {
            setError('You cannot delete your own account!');
            return;
        }

        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setError('');
        try {
            const result = await window.electronAPI.deleteUser(id);
            if (result.success) {
                loadUsers();
            } else {
                setError(result.error || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('An error occurred while deleting the user');
        }
    };

    const handleFormSuccess = () => {
        setShowUserForm(false);
        loadUsers();
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>User Management</h1>
                    <p className="text-muted">Manage admin and worker accounts</p>
                </div>
                <button onClick={handleAddUser} className="btn btn-primary">
                    + Add User
                </button>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button 
                        onClick={() => setError('')} 
                        style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                        ×
                    </button>
                </div>
            )}

            {users.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👤</div>
                    <p>No users found</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                                    <td>{u.full_name}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-info'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="btn btn-sm btn-secondary"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="btn btn-sm btn-danger"
                                                title="Delete"
                                                disabled={u.id === user.id}
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

            {/* User Form Modal */}
            {showUserForm && (
                <UserForm
                    user={selectedUser}
                    onClose={() => setShowUserForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default Users;
