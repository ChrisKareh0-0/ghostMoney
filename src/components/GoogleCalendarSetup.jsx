import React, { useState, useEffect } from 'react';
import Modal from './Modal';

function GoogleCalendarSetup({ onClose }) {
    const [isConnected, setIsConnected] = useState(false);
    const [step, setStep] = useState(1); // 1: Instructions, 2: Credentials, 3: Auth Code
    const [credentials, setCredentials] = useState({
        client_id: '',
        client_secret: '',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    });
    const [authCode, setAuthCode] = useState('');
    const [authUrl, setAuthUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const result = await window.electronAPI.googleIsConnected();
            if (result.success) {
                setIsConnected(result.isConnected);
                if (result.isConnected) {
                    setStep(4); // Connected state
                }
            }
        } catch (error) {
            console.error('Error checking Google connection:', error);
        }
    };

    const handleSaveCredentials = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await window.electronAPI.googleSaveCredentials(credentials);
            if (result.success) {
                // Get auth URL
                const urlResult = await window.electronAPI.googleGetAuthUrl();
                if (urlResult.success) {
                    setAuthUrl(urlResult.url);
                    setStep(3);
                } else {
                    setError(urlResult.error || 'Failed to get authorization URL');
                }
            } else {
                setError('Failed to save credentials');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthenticate = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await window.electronAPI.googleAuthenticate(authCode);
            if (result.success) {
                setIsConnected(true);
                setStep(4);
            } else {
                setError(result.error || 'Authentication failed');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
            return;
        }

        try {
            const result = await window.electronAPI.googleDisconnect();
            if (result.success) {
                setIsConnected(false);
                setStep(1);
                setAuthCode('');
                setAuthUrl('');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const openAuthUrl = () => {
        if (authUrl) {
            window.open(authUrl, '_blank');
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Google Calendar Setup"
            footer={
                <button onClick={onClose} className="btn btn-primary">
                    Close
                </button>
            }
        >
            <div>
                {error && <div className="alert alert-error">{error}</div>}

                {/* Step 1: Instructions */}
                {step === 1 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>Setup Instructions</h3>
                        <ol style={{ lineHeight: 1.8, marginBottom: '1.5rem' }}>
                            <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-primary)' }}>Google Cloud Console</a></li>
                            <li>Create a new project or select an existing one</li>
                            <li>Enable the <strong>Google Calendar API</strong></li>
                            <li>Go to "Credentials" and create <strong>OAuth 2.0 Client ID</strong></li>
                            <li>Select application type: <strong>Desktop app</strong></li>
                            <li>Download the credentials JSON file</li>
                            <li>Copy the <code>client_id</code> and <code>client_secret</code> from the file</li>
                        </ol>
                        <button onClick={() => setStep(2)} className="btn btn-primary w-full">
                            I Have My Credentials
                        </button>
                    </div>
                )}

                {/* Step 2: Enter Credentials */}
                {step === 2 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>Enter Credentials</h3>
                        <div className="form-group">
                            <label className="form-label">Client ID *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={credentials.client_id}
                                onChange={(e) => setCredentials({ ...credentials, client_id: e.target.value })}
                                placeholder="Your Google OAuth Client ID"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Client Secret *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={credentials.client_secret}
                                onChange={(e) => setCredentials({ ...credentials, client_secret: e.target.value })}
                                placeholder="Your Google OAuth Client Secret"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setStep(1)} className="btn btn-secondary">
                                Back
                            </button>
                            <button
                                onClick={handleSaveCredentials}
                                className="btn btn-primary"
                                disabled={loading || !credentials.client_id || !credentials.client_secret}
                            >
                                {loading ? 'Saving...' : 'Continue'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Authorization */}
                {step === 3 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>Authorize Access</h3>
                        <p style={{ marginBottom: '1rem' }}>
                            Click the button below to open Google's authorization page in your browser.
                        </p>
                        <button onClick={openAuthUrl} className="btn btn-primary w-full" style={{ marginBottom: '1.5rem' }}>
                            🔗 Open Authorization Page
                        </button>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            After authorizing, copy the authorization code and paste it below:
                        </p>
                        <div className="form-group">
                            <label className="form-label">Authorization Code *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={authCode}
                                onChange={(e) => setAuthCode(e.target.value)}
                                placeholder="Paste the authorization code here"
                            />
                        </div>
                        <button
                            onClick={handleAuthenticate}
                            className="btn btn-primary w-full"
                            disabled={loading || !authCode}
                        >
                            {loading ? 'Authenticating...' : 'Complete Setup'}
                        </button>
                    </div>
                )}

                {/* Step 4: Connected */}
                {step === 4 && isConnected && (
                    <div>
                        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
                            ✅ Google Calendar is connected!
                        </div>
                        <p style={{ marginBottom: '1.5rem' }}>
                            Your reservations will now be automatically synced to your Google Calendar.
                        </p>
                        <button onClick={handleDisconnect} className="btn btn-danger w-full">
                            Disconnect Google Calendar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default GoogleCalendarSetup;
