import React, { useState, useEffect } from 'react';
import Modal from './Modal';

function ReservationForm({ user, reservation, initialSlot, onClose, onSuccess }) {
    const [clients, setClients] = useState([]);
    const [pcs, setPCs] = useState([]);
    const [formData, setFormData] = useState({
        clientId: reservation?.client_id || '',
        pcId: reservation?.pc_id || '',
        date: reservation ? reservation.start_time.split('T')[0] : (initialSlot ? initialSlot.start.toISOString().split('T')[0] : ''),
        startTime: reservation ? reservation.start_time.split('T')[1].substring(0, 5) : (initialSlot ? initialSlot.start.toTimeString().substring(0, 5) : ''),
        endTime: reservation ? reservation.end_time.split('T')[1].substring(0, 5) : (initialSlot ? initialSlot.end.toTimeString().substring(0, 5) : ''),
        notes: reservation?.notes || '',
        syncToGoogle: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [googleConnected, setGoogleConnected] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsResult, pcsResult, googleResult] = await Promise.all([
                window.electronAPI.getClients(''),
                window.electronAPI.getActivePCs(),
                window.electronAPI.googleIsConnected()
            ]);

            if (clientsResult.success) setClients(clientsResult.data);
            if (pcsResult.success) setPCs(pcsResult.data);
            if (googleResult.success) setGoogleConnected(googleResult.isConnected);
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate
            if (!formData.clientId || !formData.pcId || !formData.date || !formData.startTime || !formData.endTime) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            // Combine date and time
            const startDateTime = `${formData.date}T${formData.startTime}:00`;
            const endDateTime = `${formData.date}T${formData.endTime}:00`;

            // Check for conflicts
            const conflictResult = await window.electronAPI.checkReservationConflict(
                formData.pcId,
                startDateTime,
                endDateTime,
                reservation?.id
            );

            if (conflictResult.success && conflictResult.hasConflict) {
                setError('This PC is already reserved for the selected time slot');
                setLoading(false);
                return;
            }

            let googleEventId = reservation?.google_event_id || null;

            // Create/update reservation
            const data = {
                clientId: formData.clientId,
                pcId: formData.pcId,
                startTime: startDateTime,
                endTime: endDateTime,
                notes: formData.notes,
                createdBy: user.id,
                googleEventId
            };

            let result;
            if (reservation) {
                result = await window.electronAPI.updateReservation(reservation.id, data);
            } else {
                result = await window.electronAPI.createReservation(data);
            }

            if (!result.success) {
                throw new Error(result.error);
            }

            // Sync to Google Calendar if enabled
            if (formData.syncToGoogle && googleConnected) {
                const client = clients.find(c => c.id === parseInt(formData.clientId));
                const pc = pcs.find(p => p.id === parseInt(formData.pcId));

                const reservationData = {
                    client_name: client?.name,
                    pc_name: pc?.name,
                    start_time: startDateTime,
                    end_time: endDateTime,
                    notes: formData.notes
                };

                if (reservation && googleEventId) {
                    // Update existing event
                    await window.electronAPI.googleUpdateEvent(googleEventId, reservationData);
                } else {
                    // Create new event
                    const eventResult = await window.electronAPI.googleCreateEvent(reservationData);
                    if (eventResult.success && eventResult.eventId) {
                        // Update reservation with Google event ID
                        await window.electronAPI.updateReservation(result.id || reservation.id, {
                            ...data,
                            googleEventId: eventResult.eventId
                        });
                    }
                }
            }

            onSuccess();
        } catch (err) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this reservation?')) {
            return;
        }

        setLoading(true);
        try {
            // Delete from Google Calendar if synced
            if (reservation.google_event_id && googleConnected) {
                await window.electronAPI.googleDeleteEvent(reservation.google_event_id);
            }

            // Delete reservation
            const result = await window.electronAPI.deleteReservation(reservation.id);
            if (result.success) {
                onSuccess();
            } else {
                setError(result.error);
                setLoading(false);
            }
        } catch (error) {
            setError('Error deleting reservation');
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={reservation ? 'Edit Reservation' : 'New Reservation'}
            footer={
                <>
                    {reservation && (
                        <button onClick={handleDelete} className="btn btn-danger" disabled={loading}>
                            Delete
                        </button>
                    )}
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
                    <label className="form-label">Client *</label>
                    <select
                        className="form-select"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        required
                    >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">PC *</label>
                    <select
                        className="form-select"
                        value={formData.pcId}
                        onChange={(e) => setFormData({ ...formData, pcId: e.target.value })}
                        required
                    >
                        <option value="">Select a PC</option>
                        {pcs.map(pc => (
                            <option key={pc.id} value={pc.id}>{pc.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Start Time *</label>
                        <input
                            type="time"
                            className="form-input"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">End Time *</label>
                        <input
                            type="time"
                            className="form-input"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-input"
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional notes about this reservation"
                    />
                </div>

                {googleConnected && (
                    <div className="form-group">
                        <label className="form-checkbox">
                            <input
                                type="checkbox"
                                checked={formData.syncToGoogle}
                                onChange={(e) => setFormData({ ...formData, syncToGoogle: e.target.checked })}
                            />
                            <span>Sync to Google Calendar</span>
                        </label>
                    </div>
                )}
            </form>
        </Modal>
    );
}

export default ReservationForm;
