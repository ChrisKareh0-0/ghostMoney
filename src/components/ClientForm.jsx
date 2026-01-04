import React, { useState } from 'react';
import Modal from './Modal';

function ClientForm({ client, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        phone: client?.phone || '',
        email: client?.email || '',
        notes: client?.notes || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = client
                ? await window.electronAPI.updateClient(client.id, formData)
                : await window.electronAPI.createClient(formData);

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
            title={client ? 'Edit Client' : 'Add New Client'}
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
                    <label className="form-label">Name *</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-textarea"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special notes about this client..."
                    />
                </div>
            </form>
        </Modal>
    );
}

export default ClientForm;
