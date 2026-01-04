const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Auth
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),

    // Users
    getUsers: () => ipcRenderer.invoke('users:getAll'),
    createUser: (data) => ipcRenderer.invoke('users:create', data),
    updateUser: (id, data) => ipcRenderer.invoke('users:update', id, data),
    deleteUser: (id) => ipcRenderer.invoke('users:delete', id),

    // Clients
    getClients: (searchTerm) => ipcRenderer.invoke('clients:getAll', searchTerm),
    getClient: (id) => ipcRenderer.invoke('clients:get', id),
    createClient: (data) => ipcRenderer.invoke('clients:create', data),
    updateClient: (id, data) => ipcRenderer.invoke('clients:update', id, data),
    deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),

    // Categories
    getCategories: () => ipcRenderer.invoke('categories:getAll'),
    createCategory: (data) => ipcRenderer.invoke('categories:create', data),
    updateCategory: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    deleteCategory: (id) => ipcRenderer.invoke('categories:delete', id),

    // Products
    getProducts: (searchTerm, categoryId) => ipcRenderer.invoke('products:getAll', searchTerm, categoryId),
    createProduct: (data) => ipcRenderer.invoke('products:create', data),
    updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),
    deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),

    // Transactions
    getClientTransactions: (clientId) => ipcRenderer.invoke('transactions:getByClient', clientId),
    getAllTransactions: (limit) => ipcRenderer.invoke('transactions:getAll', limit),
    createTransaction: (data) => ipcRenderer.invoke('transactions:create', data),
    deleteTransaction: (id) => ipcRenderer.invoke('transactions:delete', id),

    // Payments
    getClientPayments: (clientId) => ipcRenderer.invoke('payments:getByClient', clientId),
    getAllPayments: (limit) => ipcRenderer.invoke('payments:getAll', limit),
    createPayment: (data) => ipcRenderer.invoke('payments:create', data),
    deletePayment: (id) => ipcRenderer.invoke('payments:delete', id),

    // Alerts
    getAlerts: () => ipcRenderer.invoke('alerts:getAll'),
    getOverdueAlerts: () => ipcRenderer.invoke('alerts:getOverdue'),
    createAlert: (data) => ipcRenderer.invoke('alerts:create', data),
    deleteAlert: (id) => ipcRenderer.invoke('alerts:delete', id),

    // Dashboard
    getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),

    // Export
    exportToExcel: (type, data) => ipcRenderer.invoke('export:excel', type, data),
    exportToPDF: (type, data) => ipcRenderer.invoke('export:pdf', type, data),

    // Notifications
    onNotification: (callback) => ipcRenderer.on('notification', (event, data) => callback(data)),

    // PCs
    getPCs: () => ipcRenderer.invoke('pcs:getAll'),
    getActivePCs: () => ipcRenderer.invoke('pcs:getActive'),
    createPC: (data) => ipcRenderer.invoke('pcs:create', data),
    updatePC: (id, data) => ipcRenderer.invoke('pcs:update', id, data),
    deletePC: (id) => ipcRenderer.invoke('pcs:delete', id),

    // Reservations
    getReservations: () => ipcRenderer.invoke('reservations:getAll'),
    getReservationsByDateRange: (startDate, endDate) => ipcRenderer.invoke('reservations:getByDateRange', startDate, endDate),
    getReservationsByClient: (clientId) => ipcRenderer.invoke('reservations:getByClient', clientId),
    getUpcomingReservations: (limit) => ipcRenderer.invoke('reservations:getUpcoming', limit),
    checkReservationConflict: (pcId, startTime, endTime, excludeId) => ipcRenderer.invoke('reservations:checkConflict', pcId, startTime, endTime, excludeId),
    createReservation: (data) => ipcRenderer.invoke('reservations:create', data),
    updateReservation: (id, data) => ipcRenderer.invoke('reservations:update', id, data),
    deleteReservation: (id) => ipcRenderer.invoke('reservations:delete', id),
    getReservation: (id) => ipcRenderer.invoke('reservations:get', id),

    // Google Calendar
    googleIsConnected: () => ipcRenderer.invoke('google:isConnected'),
    googleSaveCredentials: (credentials) => ipcRenderer.invoke('google:saveCredentials', credentials),
    googleGetAuthUrl: () => ipcRenderer.invoke('google:getAuthUrl'),
    googleAuthenticate: (code) => ipcRenderer.invoke('google:authenticate', code),
    googleCreateEvent: (reservation) => ipcRenderer.invoke('google:createEvent', reservation),
    googleUpdateEvent: (googleEventId, reservation) => ipcRenderer.invoke('google:updateEvent', googleEventId, reservation),
    googleDeleteEvent: (googleEventId) => ipcRenderer.invoke('google:deleteEvent', googleEventId),
    googleDisconnect: () => ipcRenderer.invoke('google:disconnect'),
});
