import React, { useState } from 'react';
import Modal from './Modal';

function ProductForm({ product, categories, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        categoryId: product?.category_id || (categories[0]?.id || ''),
        price: product?.price || '',
        description: product?.description || '',
        ghostPoints: product?.ghost_points || 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = {
                ...formData,
                categoryId: parseInt(formData.categoryId),
                price: parseFloat(formData.price),
                ghostPoints: parseInt(formData.ghostPoints) || 0
            };

            const result = product
                ? await window.electronAPI.updateProduct(product.id, data)
                : await window.electronAPI.createProduct(data);

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
            title={product ? 'Edit Product' : 'Add New Product'}
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
                    <label className="form-label">Product Name *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                        className="form-select"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        required
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Price *</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-input"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">👻 GhostPoints</label>
                    <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.ghostPoints}
                        onChange={(e) => setFormData({ ...formData, ghostPoints: e.target.value })}
                        placeholder="Points earned on purchase"
                    />
                    <small className="text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                        Points awarded to clients when they purchase this product
                    </small>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description..."
                    />
                </div>
            </form>
        </Modal>
    );
}

export default ProductForm;
