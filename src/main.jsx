import React from 'react';
import ReactDOM from 'react-dom/client';
import './mockElectronAPI'; // Mock API for browser mode
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
