import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <span className="brand-icon">👻</span>
                    <span className="brand-text">GhostMoney</span>
                </div>

                <nav className="navbar-menu">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : ''}>
                        Calendar
                    </NavLink>
                    <NavLink to="/clients" className={({ isActive }) => isActive ? 'active' : ''}>
                        Clients
                    </NavLink>
                    <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
                        Products
                    </NavLink>
                    {user.role === 'admin' && (
                        <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
                            Users
                        </NavLink>
                    )}
                    {user.role === 'admin' && (
                        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                            Settings
                        </NavLink>
                    )}
                    <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                        Reports
                    </NavLink>
                </nav>
                <div className="navbar-user">
                    <span className="user-name">{user.full_name}</span>
                    <span className="user-role">{user.role}</span>
                    <button onClick={onLogout} className="btn btn-sm btn-secondary">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
