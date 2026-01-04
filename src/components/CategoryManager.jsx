import React, { useState } from 'react';
import Modal from './Modal';

function CategoryManager({ categories, onClose, onSuccess }) {
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [editingCategory, setEditingCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return;

        setLoading(true);
        setError('');

        try {
            const result = await window.electronAPI.createCategory(newCategory);
            if (result.success) {
                setNewCategory({ name: '', description: '' });
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

    const handleUpdateCategory = async (id, data) => {
        setLoading(true);
        setError('');

        try {
            const result = await window.electronAPI.updateCategory(id, data);
            if (result.success) {
                setEditingCategory(null);
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

    const handleDeleteCategory = async (id) => {
        if (!confirm('Are you sure? This will also delete all products in this category.')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteCategory(id);
            if (result.success) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Manage Categories"
        >
            {error && <div className="alert alert-error">{error}</div>}

            {/* Add New Category */}
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--green-primary)' }}>Add New Category</h4>
                <form onSubmit={handleAddCategory}>
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Category name"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Description (optional)"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        Add Category
                    </button>
                </form>
            </div>

            {/* Existing Categories */}
            <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--green-primary)' }}>Existing Categories</h4>
                {categories.length === 0 ? (
                    <p className="text-muted">No categories yet</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categories.map(category => (
                            <div
                                key={category.id}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                {editingCategory?.id === category.id ? (
                                    <div style={{ flex: 1, marginRight: '1rem' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            style={{ marginBottom: '0.5rem' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleUpdateCategory(category.id, editingCategory)}
                                                className="btn btn-sm btn-primary"
                                                disabled={loading}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingCategory(null)}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{category.name}</div>
                                            {category.description && (
                                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                    {category.description}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setEditingCategory(category)}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="btn btn-sm btn-danger"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default CategoryManager;
