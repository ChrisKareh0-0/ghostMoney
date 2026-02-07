import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ClientRankBadge from '../components/ClientRankBadge';
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
    const [rankInfo, setRankInfo] = useState(null);
    const [clientPoints, setClientPoints] = useState(0);

    useEffect(() => {
        if (!client) {
            navigate('/clients');
            return;
        }
        loadCategories();
        loadClientRankInfo();
    }, [client, navigate]);

    useEffect(() => {
        loadProducts();
    }, [selectedCategory, searchTerm]);

    const loadClientRankInfo = async () => {
        try {
            const pointsResult = await window.electronAPI.getClientPoints(client.id);
            if (pointsResult.success) {
                setClientPoints(pointsResult.data.total_points || 0);
            }
            const rankResult = await window.electronAPI.getClientRankInfo(pointsResult.data?.total_points || 0);
            if (rankResult.success) {
                setRankInfo(rankResult.data);
            }
        } catch (error) {
            console.error('Error loading client rank info:', error);
        }
    };

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

    const getTotalGhostPoints = () => {
        return cart.reduce((sum, item) => sum + ((item.product.ghost_points || 0) * item.quantity), 0);
    };

    const getDiscount = () => {
        if (!rankInfo?.currentRank?.discount_percent) return 0;
        return (getTotalAmount() * rankInfo.currentRank.discount_percent) / 100;
    };

    const getFinalTotal = () => {
        return getTotalAmount() - getDiscount();
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            setError('Please add at least one item to the cart');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const discountPercent = rankInfo?.currentRank?.discount_percent || 0;
            
            for (const item of cart) {
                // Calculate discounted price
                const discountedPrice = item.product.price * (1 - discountPercent / 100);
                
                const result = await window.electronAPI.createTransaction({
                    clientId: client.id,
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: discountedPrice,
                    createdBy: user.id
                });

                if (!result.success) {
                    throw new Error(result.error);
                }
            }

            // Award GhostPoints to client
            const totalPoints = getTotalGhostPoints();
            if (totalPoints > 0) {
                await window.electronAPI.addPointsToClient(client.id, totalPoints);
            }

            const pointsMessage = totalPoints > 0 ? ` 👻 +${totalPoints} GhostPoints awarded!` : '';
            const discountMessage = discountPercent > 0 ? ` (${discountPercent}% discount applied)` : '';
            navigate('/clients', { state: { message: `Charges added successfully!${discountMessage}${pointsMessage}` } });
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
                    <div style={{ marginTop: '0.5rem' }}>
                        <ClientRankBadge totalPoints={clientPoints} />
                    </div>
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
                                    {product.ghost_points > 0 && (
                                        <div style={{ 
                                            fontSize: '0.75rem', 
                                            color: 'var(--green-primary)',
                                            marginTop: '0.25rem'
                                        }}>
                                            👻 +{product.ghost_points} GP
                                        </div>
                                    )}
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
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>${getTotalAmount().toFixed(2)}</span>
                            </div>
                            {getDiscount() > 0 && (
                                <div className="summary-row" style={{ color: 'var(--success-color)' }}>
                                    <span>Rank Discount ({rankInfo?.currentRank?.discount_percent}%):</span>
                                    <span>-${getDiscount().toFixed(2)}</span>
                                </div>
                            )}
                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${getFinalTotal().toFixed(2)}</span>
                            </div>
                            {getTotalGhostPoints() > 0 && (
                                <div className="summary-row" style={{ 
                                    color: 'var(--green-primary)', 
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <span>👻 Points to earn:</span>
                                    <span>+{getTotalGhostPoints()} GP</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="btn btn-primary w-full"
                            disabled={loading || cart.length === 0}
                            style={{ fontSize: '1.1rem', padding: '1rem' }}
                        >
                            {loading ? 'Processing...' : `Checkout - $${getFinalTotal().toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default POS;
