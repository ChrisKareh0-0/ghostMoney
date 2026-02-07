import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import POS from './pages/POS';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <DataProvider>
                <BrowserRouter>
                    {!user ? (
                        <Login onLogin={handleLogin} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                            <Navbar user={user} onLogout={handleLogout} />
                            <main style={{ flex: 1, padding: '2rem' }}>
                                <Routes>
                                    <Route path="/" element={<Dashboard user={user} />} />
                                    <Route path="/calendar" element={<Calendar user={user} />} />
                                    <Route path="/clients" element={<Clients user={user} />} />
                                    <Route path="/pos" element={<POS user={user} />} />
                                    <Route path="/products" element={<Products user={user} />} />
                                    <Route path="/users" element={
                                        user.role === 'admin' ? <Users user={user} /> : <Navigate to="/" />
                                    } />
                                    <Route path="/settings" element={
                                        user.role === 'admin' ? <Settings user={user} /> : <Navigate to="/" />
                                    } />
                                    <Route path="/reports" element={<Reports user={user} />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </main>
                        </div>
                    )}
                </BrowserRouter>
            </DataProvider>
        </ErrorBoundary>
    );
}

export default App;
