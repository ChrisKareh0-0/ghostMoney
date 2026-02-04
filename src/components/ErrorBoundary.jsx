import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.hash = '/';
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        textAlign: 'center',
                        background: '#1a1a1a',
                        padding: '3rem',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
                        <h1 style={{ color: '#ff4444', marginBottom: '1rem' }}>Something went wrong</h1>
                        <p style={{ color: '#b0b0b0', marginBottom: '2rem' }}>
                            The application encountered an unexpected error. Your data is safe.
                        </p>
                        
                        {this.state.error && (
                            <details style={{ 
                                textAlign: 'left', 
                                marginBottom: '2rem',
                                padding: '1rem',
                                background: '#2a2a2a',
                                borderRadius: '8px',
                                fontSize: '0.85rem'
                            }}>
                                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', color: '#00ff41' }}>
                                    Error Details
                                </summary>
                                <pre style={{ 
                                    color: '#ff4444', 
                                    whiteSpace: 'pre-wrap', 
                                    wordBreak: 'break-word',
                                    margin: 0
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#2a2a2a',
                                    color: '#ffffff',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #00cc33, #00ff41)',
                                    color: '#0a0a0a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}
                            >
                                Reload Application
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
