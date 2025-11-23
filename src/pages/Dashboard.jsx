import React, { useState, useEffect } from 'react';
import { useDataRefresh } from '../context/DataContext';

function Dashboard({ user }) {
    const { refreshTrigger } = useDataRefresh();
    const [stats, setStats] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [overdueAlerts, setOverdueAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [refreshTrigger]); // Reload when refreshTrigger changes

    const loadDashboardData = async () => {
        setLoading(true); // Set loading true on every reload
        console.log('Loading dashboard data...');
        try {
            const [statsResult, transactionsResult, alertsResult] = await Promise.all([
                window.electronAPI.getDashboardStats(),
                window.electronAPI.getAllTransactions(10),
                window.electronAPI.getOverdueAlerts()
            ]);

            console.log('Dashboard stats result:', statsResult);
            console.log('Stats data:', statsResult.data);

            if (statsResult.success) setStats(statsResult.data);
            if (transactionsResult.success) setRecentTransactions(transactionsResult.data);
            if (alertsResult.success) setOverdueAlerts(alertsResult.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
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
                    <h1>Dashboard</h1>
                    <p className="text-muted">Welcome back, {user.full_name}!</p>
                </div>
                <button onClick={loadDashboardData} className="btn btn-secondary" disabled={loading}>
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Clients</div>
                        <div className="stat-value">{stats.totalClients}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-label">Outstanding Payments</div>
                        <div className="stat-value warning">${stats.totalOutstanding.toFixed(2)}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <div className="stat-label">Payments Received (This Month)</div>
                        <div className="stat-value success">${stats.currentMonthEarnings?.toFixed(2) || '0.00'}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <div className="stat-label">Overdue Alerts</div>
                        <div className="stat-value danger">{stats.overdueAlerts}</div>
                    </div>
                </div>
            </div>

            {/* Overdue Alerts */}
            {overdueAlerts.length > 0 && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">⚠️ Overdue Payments</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueAlerts.map(alert => (
                                    <tr key={alert.id}>
                                        <td>{alert.client_name}</td>
                                        <td className="text-danger">${alert.amount.toFixed(2)}</td>
                                        <td>{alert.due_date}</td>
                                        <td className="text-muted">{alert.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Transactions</h3>
                </div>
                {recentTransactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map(transaction => (
                                    <tr key={transaction.id}>
                                        <td>{transaction.client_name}</td>
                                        <td>{transaction.product_name}</td>
                                        <td>{transaction.quantity}</td>
                                        <td className="text-success">${transaction.total_amount.toFixed(2)}</td>
                                        <td className="text-muted">{new Date(transaction.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
