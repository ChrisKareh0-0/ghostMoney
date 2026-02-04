import React, { useState, useEffect } from 'react';

function Reports({ user }) {
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [clientsResult, productsResult, transactionsResult, paymentsResult] = await Promise.all([
                window.electronAPI.getClients(''),
                window.electronAPI.getProducts('', null),
                window.electronAPI.getAllTransactions(1000),
                window.electronAPI.getAllPayments(1000)
            ]);

            if (clientsResult.success) setClients(clientsResult.data);
            if (productsResult.success) setProducts(productsResult.data);
            if (transactionsResult.success) setTransactions(transactionsResult.data);
            if (paymentsResult.success) setPayments(paymentsResult.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type, format) => {
        setLoading(true);
        try {
            let data;
            switch (type) {
                case 'clients':
                    data = clients;
                    break;
                case 'products':
                    data = products;
                    break;
                case 'transactions':
                    data = transactions;
                    break;
                case 'payments':
                    data = payments;
                    break;
            }

            const result = format === 'excel'
                ? await window.electronAPI.exportToExcel(type, data)
                : await window.electronAPI.exportToPDF(type, data);

            if (result.success) {
                alert(`Export successful! File saved to: ${result.filePath}`);
            } else {
                alert('Export failed: ' + result.error);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        setLoading(true);
        try {
            const result = await window.electronAPI.backupDatabase();
            if (result.success) {
                alert(`Database backup created successfully!\n\nFile saved to: ${result.filePath}`);
            } else if (result.error !== 'Backup cancelled') {
                alert('Backup failed: ' + result.error);
            }
        } catch (error) {
            console.error('Backup error:', error);
            alert('Backup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Reports & Export</h1>
                <p className="text-muted">Export your data to Excel or PDF</p>
            </div>

            {loading && (
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Clients Export */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">👥 Clients</h3>
                    </div>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Export all clients with their balance information
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Total Clients:</strong> {clients.length}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleExport('clients', 'excel')}
                                className="btn btn-primary"
                                disabled={loading || clients.length === 0}
                            >
                                📊 Excel
                            </button>
                            <button
                                onClick={() => handleExport('clients', 'pdf')}
                                className="btn btn-secondary"
                                disabled={loading || clients.length === 0}
                            >
                                📄 PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Export */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📦 Products</h3>
                    </div>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Export all products with categories and prices
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Total Products:</strong> {products.length}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleExport('products', 'excel')}
                                className="btn btn-primary"
                                disabled={loading || products.length === 0}
                            >
                                📊 Excel
                            </button>
                            <button
                                onClick={() => handleExport('products', 'pdf')}
                                className="btn btn-secondary"
                                disabled={loading || products.length === 0}
                            >
                                📄 PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions Export */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">💳 Transactions</h3>
                    </div>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Export all transaction history
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Total Transactions:</strong> {transactions.length}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleExport('transactions', 'excel')}
                                className="btn btn-primary"
                                disabled={loading || transactions.length === 0}
                            >
                                📊 Excel
                            </button>
                            <button
                                onClick={() => handleExport('transactions', 'pdf')}
                                className="btn btn-secondary"
                                disabled={loading || transactions.length === 0}
                            >
                                📄 PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payments Export */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">💰 Payments</h3>
                    </div>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '1rem' }}>
                            Export all payment records
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>Total Payments:</strong> {payments.length}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleExport('payments', 'excel')}
                                className="btn btn-primary"
                                disabled={loading || payments.length === 0}
                            >
                                📊 Excel
                            </button>
                            <button
                                onClick={() => handleExport('payments', 'pdf')}
                                className="btn btn-secondary"
                                disabled={loading || payments.length === 0}
                            >
                                📄 PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">📈 Summary Statistics</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <div className="text-muted">Total Revenue (Transactions)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-primary)' }}>
                            ${transactions.reduce((sum, t) => sum + t.total_amount, 0).toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted">Total Payments Received</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-primary)' }}>
                            ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted">Outstanding Balance</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning-color)' }}>
                            ${clients.reduce((sum, c) => sum + c.balance, 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Database Backup */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">💾 Database Backup</h3>
                </div>
                <div>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        Create a backup of your entire database. Keep this file safe for data recovery.
                    </p>
                    <button
                        onClick={handleBackup}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        💾 Create Backup
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Reports;
