import React, { useState } from 'react';
import Modal from './Modal';

function RecordPaymentModal({ client, user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'Cash',
        notes: '',
        setDueDate: false,
        dueDate: '',
        dueTime: '12:00'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Calculate remaining balance
    const remainingBalance = formData.amount
        ? client.balance - parseFloat(formData.amount)
        : client.balance;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Record payment
            console.log('Recording payment:', {
                clientId: client.id,
                clientName: client.name,
                currentBalance: client.balance,
                paymentAmount: parseFloat(formData.amount),
                expectedNewBalance: client.balance - parseFloat(formData.amount)
            });

            const paymentResult = await window.electronAPI.createPayment({
                clientId: client.id,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
                createdBy: user.id
            });

            console.log('Payment result:', paymentResult);

            if (!paymentResult.success) {
                throw new Error(paymentResult.error);
            }

            // Create alert if due date is set (this is just a reminder, not additional balance)
            if (formData.setDueDate && formData.dueDate) {
                const remaining = client.balance - parseFloat(formData.amount);
                if (remaining > 0) {
                    // Combine date and time for the alert
                    const dueDatetime = `${formData.dueDate} ${formData.dueTime}:00`;

                    await window.electronAPI.createAlert({
                        clientId: client.id,
                        dueDate: dueDatetime,
                        amount: remaining,
                        notes: `Payment reminder - Remaining balance after payment of $${formData.amount}`,
                        createdBy: user.id
                    });
                }
            }

            onSuccess();
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Record Payment - ${client.name}`}
            footer={
                <>
                    <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Record Payment'}
                    </button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                    Current Balance: <strong>${client.balance.toFixed(2)}</strong>
                </div>

                <div className="form-group">
                    <label className="form-label">Payment Amount *</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={client.balance}
                        className="form-input"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                        className="form-select"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Mobile Payment">Mobile Payment</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-input"
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional payment notes"
                    />
                </div>

                {remainingBalance > 0 && (
                    <div className="form-group">
                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                checked={formData.setDueDate}
                                onChange={(e) => setFormData({ ...formData, setDueDate: e.target.checked })}
                            />
                            <span>Set reminder for next payment</span>
                        </label>
                        {formData.setDueDate && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="form-label">Expected Payment Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={formData.dueTime}
                                            onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    This creates a calendar reminder for the remaining balance of ${remainingBalance.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </Modal>
    );
}

export default RecordPaymentModal;
