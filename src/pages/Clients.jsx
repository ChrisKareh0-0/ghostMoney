import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDataRefresh } from '../context/DataContext';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import RecordPaymentModal from '../components/RecordPaymentModal';

function Clients({ user }) {
    const { refreshTrigger, triggerRefresh } = useDataRefresh();
    const navigate = useNavigate();
    const location = useLocation();
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadClients();
        // Check for success message from navigation
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            setTimeout(() => setSuccessMessage(''), 3000);
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [searchTerm, location.state, refreshTrigger]); // Added refreshTrigger

    const loadClients = async () => {
        try {
            const result = await window.electronAPI.getClients(searchTerm);
            if (result.success) {
                setClients(result.data);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = () => {
        setSelectedClient(null);
        setShowClientForm(true);
    };

    const handleEditClient = (client) => {
        setSelectedClient(client);
        setShowClientForm(true);
    };

    const handleDeleteClient = async (id) => {
        if (!confirm('Are you sure you want to delete this client? This will also delete all their transactions and payments.')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteClient(id);
            if (result.success) {
                loadClients();
            }
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    };

    const handleAddCharge = (client) => {
        navigate('/pos', { state: { client } });
    };

    const handleRecordPayment = (client) => {
        setSelectedClient(client);
        setShowPaymentModal(true);
    };

    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedClient(null);
        // Reload clients to refresh balances after payment
        loadClients();
        triggerRefresh(); // Trigger global refresh for all components
    };
    const handleViewHistory = async (client) => {
        setSelectedClient(client);
        try {
            const [transResult, payResult] = await Promise.all([
                window.electronAPI.getClientTransactions(client.id),
                window.electronAPI.getClientPayments(client.id)
            ]);

            if (transResult.success) setTransactions(transResult.data);
            if (payResult.success) setPayments(payResult.data);
            setShowTransactions(true);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const handleFormSuccess = () => {
        setShowClientForm(false);
        setShowPaymentModal(false);
        loadClients();
        triggerRefresh(); // Trigger global refresh for all components
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
                    <h1>Clients</h1>
                    <p className="text-muted">Manage your gaming lounge clients</p>
                </div>
                <button onClick={handleAddClient} className="btn btn-primary">
                    + Add Client
                </button>
            </div>

            {successMessage && (
                <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
                    {successMessage}
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search clients by name, phone, or email..."
                />
            </div>

            {clients.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p>{searchTerm ? 'No clients found' : 'No clients yet. Add your first client!'}</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Balance Due</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id}>
                                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                                    <td>{client.phone || '-'}</td>
                                    <td>{client.email || '-'}</td>
                                    <td>
                                        <span className={client.balance > 0 ? 'text-warning' : 'text-success'} style={{ fontWeight: 600 }}>
                                            ${Math.abs(client.balance).toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleAddCharge(client)}
                                                className="btn btn-sm btn-primary"
                                                title="Add Charge"
                                            >
                                                + Charge
                                            </button>
                                            <button
                                                onClick={() => handleRecordPayment(client)}
                                                className="btn btn-sm btn-secondary"
                                                title="Record Payment"
                                                disabled={client.balance >= 0}
                                            >
                                                💰 Payment
                                            </button>
                                            <button
                                                onClick={() => handleViewHistory(client)}
                                                className="btn btn-sm btn-secondary"
                                                title="View History"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => handleEditClient(client)}
                                                className="btn btn-sm btn-secondary"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClient(client.id)}
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

            {/* Client Form Modal */}
            {showClientForm && (
                <ClientForm
                    client={selectedClient}
                    onClose={() => setShowClientForm(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <RecordPaymentModal
                    client={selectedClient}
                    user={user}
                    onClose={handleClosePaymentModal}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Transaction History Modal */}
            {showTransactions && (
                <Modal
                    isOpen={showTransactions}
                    onClose={() => setShowTransactions(false)}
                    title={`${selectedClient?.name} - Transaction History`}
                >
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: 'var(--green-primary)', marginBottom: '1rem' }}>Charges</h4>
                        {transactions.length === 0 ? (
                            <p className="text-muted">No charges yet</p>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => (
                                            <tr key={t.id}>
                                                <td>{t.product_name}</td>
                                                <td>{t.quantity}</td>
                                                <td className="text-warning">${t.total_amount.toFixed(2)}</td>
                                                <td className="text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--green-primary)', marginBottom: '1rem' }}>Payments</h4>
                        {payments.length === 0 ? (
                            <p className="text-muted">No payments yet</p>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id}>
                                                <td className="text-success">${p.amount.toFixed(2)}</td>
                                                <td>{p.payment_method || '-'}</td>
                                                <td className="text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Clients;
