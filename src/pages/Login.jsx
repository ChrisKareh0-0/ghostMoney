import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Simple browser-compatible login
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate async login with timeout
        setTimeout(() => {
            // Hardcoded credentials for browser mode
            if (username === 'admin' && password === 'admin123') {
                const user = {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    name: 'Administrator'
                };
                onLogin(user);
            } else {
                setError('Invalid username or password. Use: admin / admin123');
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-icon">👻</span>
                    <h1 className="login-title">GhostMoney</h1>
                    <p className="login-subtitle">Gaming Lounge Management</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="text-muted">Default credentials: admin / admin123</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
