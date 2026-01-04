import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import './POS.css';

function POS({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const client = location.state?.client;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!client) {
            navigate('/clients');
            return;
        }
        loadCategories();
    }, [client, navigate]);

    useEffect(() => {
        loadProducts();
    }, [selectedCategory, searchTerm]);

    const loadProducts = async () => {
        try {
            const result = await window.electronAPI.getProducts(searchTerm, selectedCategory || null);
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

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const getTotalAmount = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            setError('Please add at least one item to the cart');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await window.electronAPI.createTransaction({
                client_id: client.id,
                total_amount: getTotalAmount(),
                items: cart.map(item => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to create transaction');
            }

            navigate('/clients', { state: { message: 'Charges added successfully!' } });
        } catch (err) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (cart.length > 0) {
            if (!confirm('You have items in the cart. Are you sure you want to cancel?')) {
                return;
            }
        }
        navigate('/clients');
    };

    if (!client) return null;

    return (
        <div className="pos-container">
            {/* Header */}
            <div className="pos-header">
                <div>
                    <h1>Point of Sale</h1>
                    <p className="text-muted">Adding charges for: <strong>{client.name}</strong></p>
                </div>
                <button onClick={handleCancel} className="btn btn-secondary">
                    ← Back to Clients
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="pos-layout">
                {/* Left Side - Products */}
                <div className="pos-products">
                    <div className="pos-products-header">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search products..."
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="category-tabs">
                        <button
                            className={`category-tab ${selectedCategory === '' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('')}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="products-grid">
                        {products.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📦</div>
                                <p>No products found</p>
                            </div>
                        ) : (
                            products.map(product => (
                                <button
                                    key={product.id}
                                    className="product-card"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-category">{product.category_name}</div>
                                    <div className="product-price">${product.price.toFixed(2)}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side - Cart */}
                <div className="pos-cart">
                    <div className="cart-header">
                        <h3>Cart</h3>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="btn btn-sm btn-secondary"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                                <p className="text-muted">Cart is empty</p>
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    Click on products to add them
                                </p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <div className="cart-item-name">{item.product.name}</div>
                                        <div className="cart-item-price">${item.product.price.toFixed(2)}</div>
                                    </div>
                                    <div className="cart-item-controls">
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                            className="qty-btn"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                            className="qty-input"
                                        />
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                            className="qty-btn"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="remove-btn"
                                            title="Remove"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="cart-item-total">
                                        ${(item.product.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Footer */}
                    <div className="cart-footer">
                        <div className="cart-summary">
                            <div className="summary-row">
                                <span>Items:</span>
                                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${getTotalAmount().toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="btn btn-primary w-full"
                            disabled={loading || cart.length === 0}
                            style={{ fontSize: '1.1rem', padding: '1rem' }}
                        >
                            {loading ? 'Processing...' : `Checkout - $${getTotalAmount().toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default POS;
