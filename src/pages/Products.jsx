import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import CategoryManager from '../components/CategoryManager';

function Products({ user }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [searchTerm, selectedCategory]);

    const loadProducts = async () => {
        try {
            const result = await window.electronAPI.getProducts(searchTerm, selectedCategory || null);
            if (result.success) {
                setProducts(result.data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
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

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setShowProductForm(true);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setShowProductForm(true);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteProduct(id);
            if (result.success) {
                loadProducts();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleFormSuccess = () => {
        setShowProductForm(false);
        setShowCategoryManager(false);
        loadProducts();
        loadCategories();
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
                    <h1>Products</h1>
                    <p className="text-muted">Manage bundles, snacks, drinks, and other products</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowCategoryManager(true)} className="btn btn-secondary">
                        📁 Categories
                    </button>
                    <button onClick={handleAddProduct} className="btn btn-primary">
                        + Add Product
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search products..."
                />
                <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {products.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <p>{searchTerm || selectedCategory ? 'No products found' : 'No products yet. Add your first product!'}</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                                    <td>
                                        <span className="badge badge-info">{product.category_name}</span>
                                    </td>
                                    <td className="text-success" style={{ fontWeight: 600 }}>
                                        ${product.price.toFixed(2)}
                                    </td>
                                    <td className="text-muted">{product.description || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className="btn btn-sm btn-secondary"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
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

            {/* Product Form Modal */}
            {showProductForm && (
                <ProductForm
                    product={selectedProduct}
                    categories={categories}
                    onClose={() => setShowProductForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Category Manager Modal */}
            {showCategoryManager && (
                <CategoryManager
                    categories={categories}
                    onClose={() => setShowCategoryManager(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}

export default Products;
