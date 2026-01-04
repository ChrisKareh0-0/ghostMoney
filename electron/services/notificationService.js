const { Notification } = require('electron');

function startNotificationService(db, mainWindow) {
    // Check for overdue alerts every 5 minutes
    setInterval(() => {
        checkOverdueAlerts(db, mainWindow);
    }, 5 * 60 * 1000);

    // Initial check
    setTimeout(() => checkOverdueAlerts(db, mainWindow), 5000);
}

function checkOverdueAlerts(db, mainWindow) {
    try {
        const overdueAlerts = db.getOverdueAlerts();

        overdueAlerts.forEach(alert => {
            // Show desktop notification
            const notification = new Notification({
                title: 'Payment Overdue',
                body: `${alert.client_name} has an overdue payment of $${alert.amount.toFixed(2)} (Due: ${alert.due_date})`,
                urgency: 'critical',
            });
            notification.show();

            // Send to renderer process
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('notification', {
                    type: 'overdue',
                    client: alert.client_name,
                    amount: alert.amount,
                    dueDate: alert.due_date,
                });
            }

            // Mark as notified
            db.markAlertNotified(alert.id);
        });
    } catch (error) {
        console.error('Error checking overdue alerts:', error);
    }
}

module.exports = { startNotificationService };
