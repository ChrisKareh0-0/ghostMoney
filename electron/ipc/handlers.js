function setupIpcHandlers(ipcMain, db) {
    // ==================== AUTH ====================
    ipcMain.handle('auth:login', async (event, username, password) => {
        try {
            const user = db.authenticateUser(username, password);
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== USERS ====================
    ipcMain.handle('users:getAll', async () => {
        try {
            return { success: true, data: db.getAllUsers() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('users:create', async (event, data) => {
        try {
            const id = db.createUser(data.username, data.password, data.fullName, data.role);
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('users:update', async (event, id, data) => {
        try {
            db.updateUser(id, data.username, data.fullName, data.role, data.password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('users:delete', async (event, id) => {
        try {
            db.deleteUser(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== CLIENTS ====================
    ipcMain.handle('clients:getAll', async (event, searchTerm) => {
        try {
            return { success: true, data: db.getAllClients(searchTerm) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clients:get', async (event, id) => {
        try {
            return { success: true, data: db.getClientById(id) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clients:create', async (event, data) => {
        try {
            const id = db.createClient(data.name, data.phone, data.email, data.notes);
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clients:update', async (event, id, data) => {
        try {
            db.updateClient(id, data.name, data.phone, data.email, data.notes);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clients:delete', async (event, id) => {
        try {
            db.deleteClient(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== CATEGORIES ====================
    ipcMain.handle('categories:getAll', async () => {
        try {
            return { success: true, data: db.getAllCategories() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('categories:create', async (event, data) => {
        try {
            const id = db.createCategory(data.name, data.description);
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('categories:update', async (event, id, data) => {
        try {
            db.updateCategory(id, data.name, data.description);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('categories:delete', async (event, id) => {
        try {
            db.deleteCategory(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== PRODUCTS ====================
    ipcMain.handle('products:getAll', async (event, searchTerm, categoryId) => {
        try {
            return { success: true, data: db.getAllProducts(searchTerm, categoryId) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('products:create', async (event, data) => {
        try {
            const id = db.createProduct(data.name, data.categoryId, data.price, data.description);
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('products:update', async (event, id, data) => {
        try {
            db.updateProduct(id, data.name, data.categoryId, data.price, data.description);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('products:delete', async (event, id) => {
        try {
            db.deleteProduct(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== TRANSACTIONS ====================
    ipcMain.handle('transactions:getByClient', async (event, clientId) => {
        try {
            return { success: true, data: db.getClientTransactions(clientId) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('transactions:getAll', async (event, limit) => {
        try {
            return { success: true, data: db.getAllTransactions(limit) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('transactions:create', async (event, data) => {
        try {
            const id = db.createTransaction(
                data.clientId,
                data.productId,
                data.quantity,
                data.unitPrice,
                data.createdBy
            );
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('transactions:delete', async (event, id) => {
        try {
            db.deleteTransaction(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== PAYMENTS ====================
    ipcMain.handle('payments:getByClient', async (event, clientId) => {
        try {
            return { success: true, data: db.getClientPayments(clientId) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('payments:getAll', async (event, limit) => {
        try {
            return { success: true, data: db.getAllPayments(limit) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('payments:create', async (event, data) => {
        try {
            const id = db.createPayment(
                data.clientId,
                data.amount,
                data.paymentMethod,
                data.notes,
                data.createdBy
            );
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('payments:delete', async (event, id) => {
        try {
            db.deletePayment(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== ALERTS ====================
    ipcMain.handle('alerts:getAll', async () => {
        try {
            return { success: true, data: db.getAllAlerts() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('alerts:getOverdue', async () => {
        try {
            return { success: true, data: db.getOverdueAlerts() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('alerts:create', async (event, data) => {
        try {
            const id = db.createAlert(
                data.clientId,
                data.dueDate,
                data.amount,
                data.notes,
                data.createdBy
            );
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('alerts:delete', async (event, id) => {
        try {
            db.deleteAlert(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== DASHBOARD ====================
    ipcMain.handle('dashboard:getStats', async () => {
        try {
            return { success: true, data: db.getDashboardStats() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== EXPORT ====================
    const { exportToExcel, exportToPDF } = require('../services/exportService');

    ipcMain.handle('export:excel', async (event, type, data) => {
        try {
            const filePath = await exportToExcel(type, data);
            return { success: true, filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('export:pdf', async (event, type, data) => {
        try {
            const filePath = await exportToPDF(type, data);
            return { success: true, filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== PCS ====================
    ipcMain.handle('pcs:getAll', async () => {
        try {
            return { success: true, data: db.getAllPCs() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pcs:getActive', async () => {
        try {
            return { success: true, data: db.getActivePCs() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pcs:create', async (event, data) => {
        try {
            const id = db.createPC(data.name, data.description);
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pcs:update', async (event, id, data) => {
        try {
            db.updatePC(id, data.name, data.description, data.isActive);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pcs:delete', async (event, id) => {
        try {
            db.deletePC(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== RESERVATIONS ====================
    ipcMain.handle('reservations:getAll', async () => {
        try {
            return { success: true, data: db.getAllReservations() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:getByDateRange', async (event, startDate, endDate) => {
        try {
            return { success: true, data: db.getReservationsByDateRange(startDate, endDate) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:getByClient', async (event, clientId) => {
        try {
            return { success: true, data: db.getReservationsByClient(clientId) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:getUpcoming', async (event, limit) => {
        try {
            return { success: true, data: db.getUpcomingReservations(limit) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:checkConflict', async (event, pcId, startTime, endTime, excludeId) => {
        try {
            const hasConflict = db.checkReservationConflict(pcId, startTime, endTime, excludeId);
            return { success: true, hasConflict };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:create', async (event, data) => {
        try {
            const id = db.createReservation(
                data.clientId,
                data.pcId,
                data.startTime,
                data.endTime,
                data.notes,
                data.createdBy,
                data.googleEventId
            );
            return { success: true, id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:update', async (event, id, data) => {
        try {
            db.updateReservation(
                id,
                data.clientId,
                data.pcId,
                data.startTime,
                data.endTime,
                data.notes,
                data.googleEventId
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:delete', async (event, id) => {
        try {
            db.deleteReservation(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reservations:get', async (event, id) => {
        try {
            return { success: true, data: db.getReservationById(id) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== GOOGLE CALENDAR ====================
    const GoogleCalendarService = require('../services/googleCalendarService');
    const googleCalendar = new GoogleCalendarService(db);

    ipcMain.handle('google:isConnected', async () => {
        try {
            return { success: true, isConnected: googleCalendar.isConnected() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:saveCredentials', async (event, credentials) => {
        try {
            const saved = googleCalendar.saveCredentials(credentials);
            if (saved) {
                googleCalendar.setupOAuthClient();
            }
            return { success: saved };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:getAuthUrl', async () => {
        try {
            const url = googleCalendar.getAuthUrl();
            return { success: true, url };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:authenticate', async (event, code) => {
        try {
            await googleCalendar.authenticateWithCode(code);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:createEvent', async (event, reservation) => {
        try {
            const eventId = await googleCalendar.createEvent(reservation);
            return { success: true, eventId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:updateEvent', async (event, googleEventId, reservation) => {
        try {
            await googleCalendar.updateEvent(googleEventId, reservation);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:deleteEvent', async (event, googleEventId) => {
        try {
            await googleCalendar.deleteEvent(googleEventId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('google:disconnect', async () => {
        try {
            googleCalendar.disconnect();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { setupIpcHandlers };
