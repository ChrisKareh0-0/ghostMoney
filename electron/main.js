const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DatabaseService = require('./database/db');
const { setupIpcHandlers } = require('./ipc/handlers');
const { startNotificationService } = require('./services/notificationService');

let mainWindow;
let db;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: '#0a0a0a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();

        // Open DevTools automatically in development
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    // Initialize database
    const dbPath = path.join(app.getPath('userData'), 'database.db');
    db = new DatabaseService(dbPath);

    // Setup IPC handlers
    setupIpcHandlers(ipcMain, db);

    // Start notification service
    startNotificationService(db, mainWindow);

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (db) db.close();
        app.quit();
    }
});

app.on('before-quit', () => {
    if (db) db.close();
});
