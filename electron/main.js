const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let db;
let logStream;

// Create log file for debugging
function initLogger() {
    try {
        const logPath = path.join(app.getPath('userData'), 'debug.log');
        logStream = fs.createWriteStream(logPath, { flags: 'a' });

        // Store original console methods FIRST
        const originalLog = console.log;
        const originalError = console.error;

        const log = (message) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}\n`;
            if (logStream) {
                logStream.write(logMessage);
            }
        };

        // Override console methods
        console.log = (...args) => {
            const message = args.join(' ');
            log(message);
            originalLog.apply(console, args);
        };

        console.error = (...args) => {
            const message = 'ERROR: ' + args.join(' ');
            log(message);
            originalError.apply(console, args);
        };

        console.log('=== GhostMoney Starting ===');
        console.log('Platform:', process.platform);
        console.log('Electron version:', process.versions.electron);
        console.log('Node version:', process.versions.node);
        console.log('App path:', app.getAppPath());
        console.log('User data path:', app.getPath('userData'));
        console.log('Is packaged:', app.isPackaged);
        console.log('Log file location:', logPath);

    } catch (error) {
        console.error('Failed to initialize logger:', error);
    }
}

function createWindow() {
    try {
        console.log('Creating main window...');

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

        console.log('Window created successfully');

        // Load the app
        if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
            console.log('Development mode - loading from localhost:5173');
            mainWindow.loadURL('http://localhost:5173');
            mainWindow.webContents.openDevTools();
        } else {
            // Production mode
            const indexPath = path.join(__dirname, '../dist/index.html');

            console.log('Production mode');
            console.log('__dirname:', __dirname);
            console.log('Attempting to load from:', indexPath);
            console.log('File exists:', fs.existsSync(indexPath));

            // Check if dist directory exists
            const distDir = path.join(__dirname, '../dist');
            console.log('Dist directory:', distDir);
            console.log('Dist exists:', fs.existsSync(distDir));

            if (fs.existsSync(distDir)) {
                const distFiles = fs.readdirSync(distDir);
                console.log('Files in dist:', distFiles.join(', '));
            }

            // Load the file with error handling
            mainWindow.loadFile(indexPath)
                .then(() => {
                    console.log('loadFile() completed successfully');
                })
                .catch(err => {
                    console.error('loadFile() failed:', err);
                    console.error('Error stack:', err.stack);

                    // Show error dialog
                    dialog.showErrorBox(
                        'Failed to Load App',
                        `Could not load index.html\n\nPath: ${indexPath}\n\nError: ${err.message}\n\nCheck debug.log in: ${app.getPath('userData')}`
                    );
                });

            // Open DevTools in production for debugging
            mainWindow.webContents.openDevTools();

            // Log any load failures
            mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                console.error('Page failed to load - Error code:', errorCode);
                console.error('Description:', errorDescription);
            });

            // Log when page finishes loading
            mainWindow.webContents.on('did-finish-load', () => {
                console.log('✓ Page loaded successfully!');
            });

            // Log any console messages from renderer
            mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
                console.log(`[Renderer ${level}] ${message} (${sourceId}:${line})`);
            });

            // Log crashes
            mainWindow.webContents.on('crashed', (event, killed) => {
                console.error('Renderer process crashed! Killed:', killed);
            });
        }

        mainWindow.on('closed', () => {
            console.log('Window closed');
            mainWindow = null;
        });

    } catch (error) {
        console.error('Error in createWindow():', error);
        console.error('Stack:', error.stack);

        dialog.showErrorBox(
            'Failed to Create Window',
            `Error: ${error.message}\n\nCheck debug.log in: ${app.getPath('userData')}`
        );
    }
}

app.whenReady().then(async () => {
    try {
        console.log('App ready event fired');

        // Initialize logger first
        initLogger();

        // Initialize database
        console.log('Initializing database...');
        const dbPath = path.join(app.getPath('userData'), 'database.db');
        console.log('Database path:', dbPath);

        try {
            const DatabaseService = require('./database/db');
            db = new DatabaseService(dbPath);
            console.log('✓ Database initialized successfully');
        } catch (dbError) {
            console.error('Database initialization failed:', dbError);
            console.error('Stack:', dbError.stack);

            // Show error but continue - maybe the app can still load
            dialog.showErrorBox(
                'Database Error',
                `Failed to initialize database: ${dbError.message}\n\nThe app may not work correctly.\n\nCheck debug.log in: ${app.getPath('userData')}`
            );
        }

        // Setup IPC handlers
        try {
            console.log('Setting up IPC handlers...');
            const { setupIpcHandlers } = require('./ipc/handlers');
            setupIpcHandlers(ipcMain, db);
            console.log('✓ IPC handlers set up successfully');
        } catch (ipcError) {
            console.error('IPC setup failed:', ipcError);
            console.error('Stack:', ipcError.stack);
        }

        // Start notification service
        try {
            console.log('Starting notification service...');
            const { startNotificationService } = require('./services/notificationService');
            startNotificationService(db, mainWindow);
            console.log('✓ Notification service started');
        } catch (notifError) {
            console.error('Notification service failed:', notifError);
            console.error('Stack:', notifError.stack);
        }

        // Create window
        createWindow();

        app.on('activate', () => {
            console.log('App activated');
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });

    } catch (error) {
        console.error('Fatal error in app.whenReady():', error);
        console.error('Stack:', error.stack);

        dialog.showErrorBox(
            'Fatal Error',
            `The application failed to start.\n\nError: ${error.message}\n\nCheck debug.log in: ${app.getPath('userData')}`
        );

        app.quit();
    }
});

app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (process.platform !== 'darwin') {
        if (db) {
            console.log('Closing database...');
            try {
                db.close();
            } catch (error) {
                console.error('Error closing database:', error);
            }
        }
        app.quit();
    }
});

app.on('before-quit', () => {
    console.log('App quitting...');
    if (db) {
        try {
            db.close();
        } catch (error) {
            console.error('Error closing database:', error);
        }
    }
    if (logStream) {
        logStream.end();
    }
});

// Catch unhandled errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise);
    console.error('Reason:', reason);
});
