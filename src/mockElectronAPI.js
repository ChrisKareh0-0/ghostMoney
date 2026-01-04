// Real API Client for Local Node.js Backend
// Connects to http://localhost:3001

const API_URL = 'http://localhost:3001/api';

const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return { success: false, error: error.message };
    }
};

if (!window.electronAPI) {
    console.log('🌐 Connecting to Local Backend at', API_URL);

    window.electronAPI = {
        // Auth
        login: (username, password) => apiCall('/login', 'POST', { username, password }),

        // Dashboard
        getDashboardStats: () => apiCall('/dashboard'),
        getAllTransactions: (limit) => apiCall(`/transactions?limit=${limit}`),
        getOverdueAlerts: () => apiCall('/alerts/overdue'),

        // Clients
        getClients: (searchTerm) => apiCall(`/clients?search=${encodeURIComponent(searchTerm || '')}`),
        createClient: (data) => apiCall('/clients', 'POST', data),
        updateClient: (id, data) => apiCall(`/clients/${id}`, 'PUT', data),
        deleteClient: (id) => apiCall(`/clients/${id}`, 'DELETE'),
        getClientTransactions: (id) => apiCall(`/clients/${id}/transactions`),
        getClientPayments: (id) => apiCall(`/clients/${id}/payments`),

        // Products
        getProducts: (searchTerm, categoryId) => {
            let query = `?search=${encodeURIComponent(searchTerm || '')}`;
            if (categoryId) query += `&categoryId=${categoryId}`;
            return apiCall(`/products${query}`);
        },
        createProduct: (data) => apiCall('/products', 'POST', data),
        updateProduct: (id, data) => apiCall(`/products/${id}`, 'PUT', data),
        deleteProduct: (id) => apiCall(`/products/${id}`, 'DELETE'),

        // Categories
        getCategories: () => apiCall('/categories'),
        createCategory: (data) => apiCall('/categories', 'POST', data),
        updateCategory: (id, data) => apiCall(`/categories/${id}`, 'PUT', data),
        deleteCategory: (id) => apiCall(`/categories/${id}`, 'DELETE'),

        // Transactions
        createTransaction: (data) => apiCall('/transactions', 'POST', data),

        // Payments
        createPayment: (data) => apiCall('/payments', 'POST', data),
        getAllPayments: (limit) => apiCall(`/payments?limit=${limit}`),

        // PCs
        getPCs: () => apiCall('/pcs'),
        getActivePCs: () => apiCall('/pcs/active'),
        createPC: (data) => apiCall('/pcs', 'POST', data),
        updatePC: (id, data) => apiCall(`/pcs/${id}`, 'PUT', data),
        deletePC: (id) => apiCall(`/pcs/${id}`, 'DELETE'),

        // Reservations
        getReservations: () => apiCall('/reservations'),
        createReservation: (data) => apiCall('/reservations', 'POST', data),
        updateReservation: (id, data) => apiCall(`/reservations/${id}`, 'PUT', data),
        deleteReservation: (id) => apiCall(`/reservations/${id}`, 'DELETE'),
        checkReservationConflict: () => Promise.resolve({ success: true, hasConflict: false }), // TODO: Implement on server

        // Alerts
        getAlerts: () => apiCall('/alerts'),
        createAlert: (data) => apiCall('/alerts', 'POST', data),

        // Users
        getUsers: () => apiCall('/users'),
        createUser: (data) => apiCall('/users', 'POST', data),
        updateUser: (id, data) => apiCall(`/users/${id}`, 'PUT', data),
        deleteUser: (id) => apiCall(`/users/${id}`, 'DELETE'),

        // Google Calendar (mock)
        googleIsConnected: () => Promise.resolve({ success: true, connected: false }),
        googleSaveCredentials: () => Promise.resolve({ success: false, message: 'Not available' }),
        googleCreateEvent: () => Promise.resolve({ success: false }),
        googleUpdateEvent: () => Promise.resolve({ success: false }),
        googleDeleteEvent: () => Promise.resolve({ success: false }),

        // Export
        exportToExcel: async (type, data) => {
            // Fetch all data for backup
            try {
                const [users, clients, products, categories, transactions, payments, pcs, reservations, alerts] = await Promise.all([
                    apiCall('/users'),
                    apiCall('/clients'),
                    apiCall('/products'),
                    apiCall('/categories'),
                    apiCall('/transactions?limit=10000'),
                    apiCall('/payments?limit=10000'),
                    apiCall('/pcs'),
                    apiCall('/reservations'),
                    apiCall('/alerts')
                ]);

                const fullData = {
                    users: users.data,
                    clients: clients.data,
                    products: products.data,
                    categories: categories.data,
                    transactions: transactions.data,
                    payments: payments.data,
                    pcs: pcs.data,
                    reservations: reservations.data,
                    alerts: alerts.data
                };

                const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ghostmoney_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return { success: true, message: 'Database downloaded successfully' };
            } catch (e) {
                console.error('Export failed:', e);
                return { success: false, message: 'Export failed' };
            }
        },

        exportToPDF: async () => ({ success: false, message: 'Not supported' })
    };

    // Import Functionality
    window.importDatabase = (fileInput) => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // TODO: Implement bulk import endpoint on server
                    // For now, just alert
                    alert('Import not yet supported with local backend. Please contact support.');
                } catch (err) {
                    alert('❌ Error parsing file');
                }
            };
            reader.readAsText(file);
        }
    };

    console.log('✅ API Client loaded');
}
