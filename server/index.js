const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, '..', 'ghostmoney.db');
let dbInstance = null;

// Wrapper to mimic better-sqlite3 API
class DBWrapper {
    constructor(db) {
        this.db = db;
    }

    prepare(sql) {
        const stmt = this.db.prepare(sql);
        const sanitize = (params) => params.map(p => p === undefined ? null : p);
        return {
            get: (...params) => {
                stmt.bind(sanitize(params));
                let result = undefined;
                if (stmt.step()) {
                    result = stmt.getAsObject();
                }
                stmt.free();
                return result;
            },
            all: (...params) => {
                stmt.bind(sanitize(params));
                const results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                return results;
            },
            run: (...params) => {
                stmt.bind(sanitize(params));
                stmt.step();
                stmt.free();
                saveDb(); // Auto-save on write

                // Get last insert ID
                const idRes = this.db.exec("SELECT last_insert_rowid()")[0];
                const lastId = idRes ? idRes.values[0][0] : 0;
                return { lastInsertRowid: lastId };
            }
        };
    }

    exec(sql) {
        this.db.exec(sql);
        saveDb();
    }
}

// Save DB to file
const saveDb = () => {
    if (dbInstance) {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
};

// Initialize Database
const startServer = async () => {
    try {
        console.log('🔹 Initializing SQL.js...');
        const SQL = await initSqlJs();
        console.log('✅ SQL.js initialized');

        if (fs.existsSync(dbPath)) {
            const filebuffer = fs.readFileSync(dbPath);
            dbInstance = new SQL.Database(filebuffer);
            console.log(`📂 Database loaded from: ${dbPath}`);
        } else {
            dbInstance = new SQL.Database();
            console.log(`✨ New database created at: ${dbPath}`);
        }

        const db = new DBWrapper(dbInstance);
        console.log('🔹 DB Wrapper initialized');

        // Initialize Tables
        console.log('🔹 Creating tables...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT,
                name TEXT
            );
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                phone TEXT,
                email TEXT,
                notes TEXT,
                balance REAL DEFAULT 0,
                created_at TEXT
            );
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                category_id INTEGER,
                price REAL,
                stock INTEGER
            );
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                color TEXT
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                total_amount REAL,
                items TEXT, -- JSON string
                date TEXT
            );
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                amount REAL,
                payment_method TEXT,
                date TEXT
            );
            CREATE TABLE IF NOT EXISTS pcs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                status TEXT,
                type TEXT
            );
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                pc_id INTEGER,
                start_time TEXT,
                end_time TEXT,
                status TEXT
            );
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT,
                type TEXT,
                resolved INTEGER DEFAULT 0,
                created_at TEXT
            );
        `);
        console.log('✅ Tables created');

        // Seed Admin User if empty
        console.log('🔹 Checking admin user...');
        const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
        if (!admin) {
            console.log('🔹 Creating admin user...');
            db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('admin', 'admin123', 'admin', 'Administrator');
            console.log('👤 Admin user created');
        }

        // Seed Default Category if empty
        console.log('🔹 Checking categories...');
        const category = db.prepare('SELECT * FROM categories LIMIT 1').get();
        if (!category) {
            console.log('🔹 Creating default category...');
            db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run('Gaming', '#4F46E5');
        }
        console.log('✅ Database seeded');

        // --- API Routes ---

        // Auth
        app.post('/api/login', (req, res) => {
            const { username, password } = req.body;
            const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
            if (user) {
                res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
            } else {
                res.json({ success: false, error: 'Invalid credentials' });
            }
        });

        // Dashboard Stats
        app.get('/api/dashboard', (req, res) => {
            try {
                const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
                const activeClients = db.prepare('SELECT COUNT(*) as count FROM clients WHERE balance < 0').get().count;
                const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions').get().total;

                // Today's Revenue
                const today = new Date().toISOString().split('T')[0];
                const todayRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE date LIKE ?').get(`${today}%`).total;

                // Total Outstanding (sum of negative balances)
                const totalOutstanding = Math.abs(db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM clients WHERE balance < 0').get().total);

                // Current Month Earnings
                const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                const currentMonthEarnings = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE date LIKE ?').get(`${currentMonth}%`).total;

                const overdueAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0').get().count;
                const activePCs = db.prepare("SELECT COUNT(*) as count FROM pcs WHERE status = 'occupied'").get().count;
                const totalPCs = db.prepare('SELECT COUNT(*) as count FROM pcs').get().count;

                res.json({
                    success: true,
                    data: {
                        totalClients,
                        activeClients,
                        totalRevenue,
                        todayRevenue,
                        totalOutstanding,
                        currentMonthEarnings,
                        overdueAlerts,
                        activePCs,
                        totalPCs
                    }
                });
            } catch (err) {
                console.error(err);
                res.json({ success: false, error: err.message });
            }
        });

        // Clients
        app.get('/api/clients', (req, res) => {
            const { search } = req.query;
            let query = 'SELECT id, name, phone, email, notes, COALESCE(balance, 0) as balance, created_at FROM clients';
            const params = [];
            if (search) {
                query += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            const clients = db.prepare(query).all(...params);
            res.json({ success: true, data: clients });
        });

        app.post('/api/clients', (req, res) => {
            const { name, phone, email, notes } = req.body;
            const info = db.prepare('INSERT INTO clients (name, phone, email, notes, created_at, balance) VALUES (?, ?, ?, ?, ?, 0)').run(name, phone, email, notes, new Date().toISOString());
            const client = db.prepare('SELECT id, name, phone, email, notes, COALESCE(balance, 0) as balance, created_at FROM clients WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, client });
        });

        app.put('/api/clients/:id', (req, res) => {
            const { id } = req.params;
            const { name, phone, email, notes } = req.body;
            db.prepare('UPDATE clients SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?').run(name, phone, email, notes, id);
            const client = db.prepare('SELECT id, name, phone, email, notes, COALESCE(balance, 0) as balance, created_at FROM clients WHERE id = ?').get(id);
            res.json({ success: true, client });
        });

        app.delete('/api/clients/:id', (req, res) => {
            const { id } = req.params;
            db.prepare('DELETE FROM clients WHERE id = ?').run(id);
            res.json({ success: true });
        });

        app.get('/api/clients/:id/transactions', (req, res) => {
            const transactions = db.prepare('SELECT * FROM transactions WHERE client_id = ? ORDER BY date DESC').all(req.params.id);
            res.json({ success: true, data: transactions });
        });

        app.get('/api/clients/:id/payments', (req, res) => {
            const payments = db.prepare('SELECT * FROM payments WHERE client_id = ? ORDER BY date DESC').all(req.params.id);
            res.json({ success: true, data: payments });
        });

        // Products
        app.get('/api/products', (req, res) => {
            const { search, categoryId } = req.query;
            let query = 'SELECT id, name, category_id, COALESCE(price, 0) as price, COALESCE(stock, 0) as stock FROM products WHERE 1=1';
            const params = [];
            if (search) {
                query += ' AND name LIKE ?';
                params.push(`%${search}%`);
            }
            if (categoryId) {
                query += ' AND category_id = ?';
                params.push(categoryId);
            }
            const products = db.prepare(query).all(...params);
            res.json({ success: true, data: products });
        });

        app.post('/api/products', (req, res) => {
            const { name, category_id, price, stock } = req.body;
            const info = db.prepare('INSERT INTO products (name, category_id, price, stock) VALUES (?, ?, ?, ?)').run(name, category_id, price, stock);
            const product = db.prepare('SELECT id, name, category_id, COALESCE(price, 0) as price, COALESCE(stock, 0) as stock FROM products WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, product });
        });

        app.put('/api/products/:id', (req, res) => {
            const { id } = req.params;
            const { name, category_id, price, stock } = req.body;
            db.prepare('UPDATE products SET name = ?, category_id = ?, price = ?, stock = ? WHERE id = ?').run(name, category_id, price, stock, id);
            const product = db.prepare('SELECT id, name, category_id, COALESCE(price, 0) as price, COALESCE(stock, 0) as stock FROM products WHERE id = ?').get(id);
            res.json({ success: true, product });
        });

        app.delete('/api/products/:id', (req, res) => {
            db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });

        // Categories
        app.get('/api/categories', (req, res) => {
            const categories = db.prepare('SELECT * FROM categories').all();
            res.json({ success: true, data: categories });
        });

        app.post('/api/categories', (req, res) => {
            const { name, color } = req.body;
            const info = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color);
            const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, category });
        });

        app.put('/api/categories/:id', (req, res) => {
            const { id } = req.params;
            const { name, color } = req.body;
            db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(name, color, id);
            const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
            res.json({ success: true, category });
        });

        app.delete('/api/categories/:id', (req, res) => {
            db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });

        // Transactions
        app.get('/api/transactions', (req, res) => {
            const { limit } = req.query;
            const transactions = db.prepare(`
                SELECT 
                    t.id, 
                    t.client_id, 
                    c.name as client_name,
                    COALESCE(t.total_amount, 0) as total_amount, 
                    t.items, 
                    t.date 
                FROM transactions t
                LEFT JOIN clients c ON t.client_id = c.id
                ORDER BY t.date DESC 
                LIMIT ${limit || 10}
            `).all();
            res.json({ success: true, data: transactions });
        });

        app.post('/api/transactions', (req, res) => {
            const { client_id, total_amount, items } = req.body;
            const date = new Date().toISOString();

            const info = db.prepare('INSERT INTO transactions (client_id, total_amount, items, date) VALUES (?, ?, ?, ?)').run(client_id, total_amount, JSON.stringify(items), date);

            // Update client balance
            if (client_id) {
                db.prepare('UPDATE clients SET balance = balance - ? WHERE id = ?').run(total_amount, client_id);
            }

            const transaction = db.prepare('SELECT id, client_id, COALESCE(total_amount, 0) as total_amount, items, date FROM transactions WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, transaction });
        });

        // Payments
        app.get('/api/payments', (req, res) => {
            const { limit } = req.query;
            const payments = db.prepare(`SELECT id, client_id, COALESCE(amount, 0) as amount, payment_method, date FROM payments ORDER BY date DESC LIMIT ${limit || 100}`).all();
            res.json({ success: true, data: payments });
        });

        app.post('/api/payments', (req, res) => {
            const { client_id, amount, payment_method } = req.body;
            const date = new Date().toISOString();

            const info = db.prepare('INSERT INTO payments (client_id, amount, payment_method, date) VALUES (?, ?, ?, ?)').run(client_id, amount, payment_method, date);

            // Update client balance
            if (client_id) {
                db.prepare('UPDATE clients SET balance = balance + ? WHERE id = ?').run(amount, client_id);
            }

            const payment = db.prepare('SELECT id, client_id, COALESCE(amount, 0) as amount, payment_method, date FROM payments WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, payment });
        });

        // PCs
        app.get('/api/pcs', (req, res) => {
            const pcs = db.prepare('SELECT * FROM pcs').all();
            res.json({ success: true, data: pcs });
        });

        app.get('/api/pcs/active', (req, res) => {
            const pcs = db.prepare("SELECT * FROM pcs WHERE status = 'available'").all();
            res.json({ success: true, data: pcs });
        });

        app.post('/api/pcs', (req, res) => {
            const { name, type } = req.body;
            const info = db.prepare("INSERT INTO pcs (name, type, status) VALUES (?, ?, 'available')").run(name, type);
            const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, pc });
        });

        app.put('/api/pcs/:id', (req, res) => {
            const { id } = req.params;
            const { name, type, status } = req.body;
            db.prepare('UPDATE pcs SET name = ?, type = ?, status = ? WHERE id = ?').run(name, type, status, id);
            const pc = db.prepare('SELECT * FROM pcs WHERE id = ?').get(id);
            res.json({ success: true, pc });
        });

        app.delete('/api/pcs/:id', (req, res) => {
            db.prepare('DELETE FROM pcs WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });

        // Reservations
        app.get('/api/reservations', (req, res) => {
            const reservations = db.prepare('SELECT * FROM reservations').all();
            res.json({ success: true, data: reservations });
        });

        app.post('/api/reservations', (req, res) => {
            const { client_id, pc_id, start_time, end_time, status } = req.body;
            const info = db.prepare('INSERT INTO reservations (client_id, pc_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)').run(client_id, pc_id, start_time, end_time, status);
            const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, reservation, id: reservation.id });
        });

        app.put('/api/reservations/:id', (req, res) => {
            const { id } = req.params;
            const { status } = req.body;
            db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
            const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
            res.json({ success: true, reservation });
        });

        app.delete('/api/reservations/:id', (req, res) => {
            db.prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });

        // Alerts
        app.get('/api/alerts', (req, res) => {
            const alerts = db.prepare('SELECT * FROM alerts').all();
            res.json({ success: true, data: alerts });
        });

        app.get('/api/alerts/overdue', (req, res) => {
            const alerts = db.prepare('SELECT * FROM alerts WHERE resolved = 0').all();
            res.json({ success: true, data: alerts });
        });

        app.post('/api/alerts', (req, res) => {
            const { message, type } = req.body;
            const info = db.prepare('INSERT INTO alerts (message, type, created_at) VALUES (?, ?, ?)').run(message, type, new Date().toISOString());
            const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, alert });
        });

        // Users
        app.get('/api/users', (req, res) => {
            const users = db.prepare('SELECT * FROM users').all();
            res.json({ success: true, data: users });
        });

        app.post('/api/users', (req, res) => {
            const { username, password, role, name } = req.body;
            const info = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run(username, password, role, name);
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
            res.json({ success: true, user });
        });

        app.put('/api/users/:id', (req, res) => {
            const { id } = req.params;
            const { username, password, role, name } = req.body;
            db.prepare('UPDATE users SET username = ?, password = ?, role = ?, name = ? WHERE id = ?').run(username, password, role, name, id);
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
            res.json({ success: true, user });
        });

        app.delete('/api/users/:id', (req, res) => {
            db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
            res.json({ success: true });
        });

        // Serve Static Files (React App)
        app.use(express.static(path.join(__dirname, '../dist')));

        // Global Error Handler
        app.use((err, req, res, next) => {
            console.error('🔥 Server Error:', err);
            res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
        });

        // Catch-all handler for SPA
        app.get(/.*/, (req, res) => {
            res.sendFile(path.join(__dirname, '../dist/index.html'));
        });

        // Start Server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();
