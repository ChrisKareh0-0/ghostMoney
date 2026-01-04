import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { useDataRefresh } from '../context/DataContext';
import ReservationForm from '../components/ReservationForm';
import PCManager from '../components/PCManager';
import GoogleCalendarSetup from '../components/GoogleCalendarSetup';
import Modal from '../components/Modal';

const localizer = momentLocalizer(moment);

function Calendar({ user }) {
    const { refreshTrigger } = useDataRefresh();
    const [events, setEvents] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [showPCManager, setShowPCManager] = useState(false);
    const [showGoogleSetup, setShowGoogleSetup] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [filterPC, setFilterPC] = useState('');
    const [pcs, setPCs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [refreshTrigger]); // Reload when refreshTrigger changes

    useEffect(() => {
        // Combine reservations and due payments into calendar events
        const calendarEvents = [];

        // Add reservations
        reservations.forEach(res => {
            if (!filterPC || res.pc_id === parseInt(filterPC)) {
                calendarEvents.push({
                    id: `res-${res.id}`,
                    title: `${res.client_name} - ${res.pc_name}`,
                    start: new Date(res.start_time),
                    end: new Date(res.end_time),
                    type: 'reservation',
                    data: res
                });
            }
        });

        // Add due payments
        duePayments.forEach(payment => {
            // Parse the due_date - it can be either YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
            let dueDate;
            if (payment.due_date.includes(' ')) {
                // Has time component
                dueDate = new Date(payment.due_date.replace(' ', 'T'));
            } else {
                // Just date, set to noon
                dueDate = new Date(payment.due_date + 'T12:00:00');
            }

            calendarEvents.push({
                id: `payment-${payment.id}`,
                title: `💰 ${payment.client_name} - $${payment.amount.toFixed(2)}`,
                start: dueDate,
                end: dueDate,
                allDay: false,
                type: 'payment',
                data: payment
            });
        });

        setEvents(calendarEvents);
    }, [reservations, duePayments, filterPC]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load reservations
            const resResult = await window.electronAPI.getReservations();
            if (resResult.success) {
                setReservations(resResult.data);
            }

            // Load due payments
            const alertsResult = await window.electronAPI.getAlerts();
            if (alertsResult.success) {
                setDuePayments(alertsResult.data);
            }

            // Load PCs
            const pcsResult = await window.electronAPI.getPCs();
            if (pcsResult.success) {
                setPCs(pcsResult.data);
            }
        } catch (error) {
            console.error('Error loading calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = useCallback((slotInfo) => {
        setSelectedSlot({
            start: slotInfo.start,
            end: slotInfo.end
        });
        setSelectedEvent(null);
        setShowReservationForm(true);
    }, []);

    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
        if (event.type === 'reservation') {
            setShowReservationForm(true);
        }
    }, []);

    const handleCloseForm = () => {
        setShowReservationForm(false);
        setSelectedEvent(null);
        setSelectedSlot(null);
    };

    const handleFormSuccess = () => {
        handleCloseForm();
        loadData();
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#00cc33';
        let color = '#0a0a0a';

        if (event.type === 'payment') {
            const dueDate = new Date(event.data.due_date);
            const now = new Date();
            if (dueDate < now) {
                backgroundColor = '#ff4444'; // Red for overdue
            } else {
                backgroundColor = '#ffaa00'; // Yellow for upcoming
            }
            color = '#ffffff';
        }

        return {
            style: {
                backgroundColor,
                color,
                borderRadius: '4px',
                border: 'none',
                fontWeight: 600,
            }
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="calendar-container">
            {/* Header */}
            <div className="calendar-header">
                <div>
                    <h1>Calendar & Reservations</h1>
                    <p className="text-muted">Manage PC reservations and view due payments</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setShowPCManager(true)} className="btn btn-secondary">
                        🖥️ Manage PCs
                    </button>
                    <button onClick={() => setShowGoogleSetup(true)} className="btn btn-secondary">
                        📅 Google Calendar
                    </button>
                    <button onClick={() => { setSelectedSlot(null); setSelectedEvent(null); setShowReservationForm(true); }} className="btn btn-primary">
                        + New Reservation
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="calendar-filters">
                <div className="filter-group">
                    <label>Filter by PC:</label>
                    <select
                        value={filterPC}
                        onChange={(e) => setFilterPC(e.target.value)}
                        className="form-select"
                    >
                        <option value="">All PCs</option>
                        {pcs.map(pc => (
                            <option key={pc.id} value={pc.id}>{pc.name}</option>
                        ))}
                    </select>
                </div>

                <div className="calendar-legend">
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#00cc33' }}></span>
                        <span>Reservations</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#ffaa00' }}></span>
                        <span>Due Payments</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#ff4444' }}></span>
                        <span>Overdue</span>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="calendar-wrapper">
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView="week"
                    step={30}
                    showMultiDayTimes
                    popup
                />
            </div>

            {/* Reservation Form Modal */}
            {showReservationForm && (
                <ReservationForm
                    user={user}
                    reservation={selectedEvent?.type === 'reservation' ? selectedEvent.data : null}
                    initialSlot={selectedSlot}
                    onClose={handleCloseForm}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* PC Manager Modal */}
            {showPCManager && (
                <PCManager
                    onClose={() => setShowPCManager(false)}
                    onSuccess={() => {
                        setShowPCManager(false);
                        loadData();
                    }}
                />
            )}

            {/* Google Calendar Setup Modal */}
            {showGoogleSetup && (
                <GoogleCalendarSetup
                    onClose={() => setShowGoogleSetup(false)}
                />
            )}
        </div>
    );
}

export default Calendar;
