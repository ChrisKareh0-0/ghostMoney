import React, { useState, useEffect } from 'react';
import Modal from './Modal';

function AddChargeModal({ client, user, onClose, onSuccess }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, [selectedCategory]);

    const loadProducts = async () => {
        try {
            const result = await window.electronAPI.getProducts('', selectedCategory || null);
            if (result.success) {
                setProducts(result.data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const result = await window.electronAPI.getCategories();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            setCart(cart.filter(item => item.product.id !== productId));
        } else {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            ));
        }
    };

    const getTotalAmount = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            setError('Please add at least one item');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create a transaction for each item in cart
            for (const item of cart) {
                const result = await window.electronAPI.createTransaction({
                    clientId: client.id,
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    createdBy: user.id
                });

                if (!result.success) {
                    throw new Error(result.error);
                }
            }

            onSuccess();
        } catch (err) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Add Charges - ${client.name}`}
            footer={
                <>
                    <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={loading || cart.length === 0}>
                        {loading ? 'Processing...' : `Add Charges ($${getTotalAmount().toFixed(2)})`}
                    </button>
                </>
            }
        >
            {error && <div className="alert alert-error">{error}</div>}

            {/* Category Filter */}
            <div className="form-group">
                <label className="form-label">Filter by Category</label>
                <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Select Products</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    {products.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="btn btn-secondary"
                            style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{product.name}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--green-primary)' }}>${product.price.toFixed(2)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cart */}
            <div>
                <label className="form-label">Cart</label>
                {cart.length === 0 ? (
                    <div className="empty-state" style={{ padding: '1rem' }}>
                        <p style={{ margin: 0 }}>No items added yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map(item => (
                                    <tr key={item.product.id}>
                                        <td>{item.product.name}</td>
                                        <td>${item.product.price.toFixed(2)}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                                                style={{ width: '60px', padding: '0.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                                            />
                                        </td>
                                        <td className="text-success">${(item.product.price * item.quantity).toFixed(2)}</td>
                                        <td>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 0)}
                                                className="btn-icon"
                                                style={{ color: 'var(--error-color)' }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ borderTop: '2px solid var(--green-secondary)' }}>
                                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
                                    <td className="text-success" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        ${getTotalAmount().toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default AddChargeModal;
