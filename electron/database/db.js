const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseService {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints
    this.initializeDatabase();
  }

  initializeDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
    this.seedDefaultData();
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  seedDefaultData() {
    // Create default admin user if no users exist
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      const hashedPassword = this.hashPassword('admin123');
      this.db.prepare(`
        INSERT INTO users (username, password, full_name, role)
        VALUES (?, ?, ?, ?)
      `).run('admin', hashedPassword, 'Administrator', 'admin');
    }

    // Create default categories if none exist
    const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (categoryCount.count === 0) {
      const categories = ['Bundles', 'Snacks', 'Drinks', 'Other'];
      const stmt = this.db.prepare('INSERT INTO categories (name) VALUES (?)');
      categories.forEach(cat => stmt.run(cat));
    }

    // Create default PCs if none exist
    const pcCount = this.db.prepare('SELECT COUNT(*) as count FROM pcs').get();
    if (pcCount.count === 0) {
      const pcs = [
        { name: 'PC-1', description: 'Standard Gaming PC' },
        { name: 'PC-2', description: 'Standard Gaming PC' },
        { name: 'PC-3', description: 'Standard Gaming PC' },
        { name: 'PC-4', description: 'Standard Gaming PC' },
        { name: 'PC-5', description: 'Standard Gaming PC' },
        { name: 'VIP-1', description: 'VIP Gaming Station' },
        { name: 'VIP-2', description: 'VIP Gaming Station' },
      ];
      const stmt = this.db.prepare('INSERT INTO pcs (name, description) VALUES (?, ?)');
      pcs.forEach(pc => stmt.run(pc.name, pc.description));
    }

    // Create default ranks if none exist
    this.seedDefaultRanks();
  }

  // ==================== AUTH ====================
  authenticateUser(username, password) {
    const hashedPassword = this.hashPassword(password);
    return this.db.prepare(`
      SELECT id, username, full_name, role FROM users 
      WHERE username = ? AND password = ?
    `).get(username, hashedPassword);
  }

  // ==================== USERS ====================
  getAllUsers() {
    return this.db.prepare(`
      SELECT id, username, full_name, role, created_at 
      FROM users ORDER BY created_at DESC
    `).all();
  }

  createUser(username, password, fullName, role) {
    const hashedPassword = this.hashPassword(password);
    const result = this.db.prepare(`
      INSERT INTO users (username, password, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, fullName, role);
    return result.lastInsertRowid;
  }

  updateUser(id, username, fullName, role, password = null) {
    if (password) {
      const hashedPassword = this.hashPassword(password);
      this.db.prepare(`
        UPDATE users SET username = ?, full_name = ?, role = ?, password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(username, fullName, role, hashedPassword, id);
    } else {
      this.db.prepare(`
        UPDATE users SET username = ?, full_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(username, fullName, role, id);
    }
  }

  deleteUser(id) {
    // Check if user has created transactions or payments
    const hasTransactions = this.db.prepare(
      'SELECT COUNT(*) as count FROM transactions WHERE created_by = ?'
    ).get(id).count > 0;
    
    const hasPayments = this.db.prepare(
      'SELECT COUNT(*) as count FROM payments WHERE created_by = ?'
    ).get(id).count > 0;
    
    if (hasTransactions || hasPayments) {
      throw new Error('Cannot delete user with existing transactions or payments.');
    }
    
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  // ==================== CLIENTS ====================
  getAllClients(searchTerm = '') {
    const query = searchTerm
      ? `SELECT c.*, 
          COALESCE(SUM(t.total_amount), 0) - COALESCE(SUM(p.amount), 0) as balance
         FROM clients c
         LEFT JOIN transactions t ON c.id = t.client_id
         LEFT JOIN payments p ON c.id = p.client_id
         WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?
         GROUP BY c.id
         ORDER BY c.name`
      : `SELECT c.*, 
          COALESCE(SUM(t.total_amount), 0) - COALESCE(SUM(p.amount), 0) as balance
         FROM clients c
         LEFT JOIN transactions t ON c.id = t.client_id
         LEFT JOIN payments p ON c.id = p.client_id
         GROUP BY c.id
         ORDER BY c.name`;

    if (searchTerm) {
      const search = `%${searchTerm}%`;
      return this.db.prepare(query).all(search, search, search);
    }
    return this.db.prepare(query).all();
  }

  getClientById(id) {
    return this.db.prepare(`
      SELECT c.*, 
        COALESCE(SUM(t.total_amount), 0) - COALESCE(SUM(p.amount), 0) as balance
      FROM clients c
      LEFT JOIN transactions t ON c.id = t.client_id
      LEFT JOIN payments p ON c.id = p.client_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id);
  }

  createClient(name, phone, email, notes) {
    const result = this.db.prepare(`
      INSERT INTO clients (name, phone, email, notes)
      VALUES (?, ?, ?, ?)
    `).run(name, phone, email, notes);
    return result.lastInsertRowid;
  }

  updateClient(id, name, phone, email, notes) {
    this.db.prepare(`
      UPDATE clients SET name = ?, phone = ?, email = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, phone, email, notes, id);
  }

  deleteClient(id) {
    this.db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  }

  // ==================== CATEGORIES ====================
  getAllCategories() {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all();
  }

  createCategory(name, description) {
    const result = this.db.prepare(`
      INSERT INTO categories (name, description) VALUES (?, ?)
    `).run(name, description);
    return result.lastInsertRowid;
  }

  updateCategory(id, name, description) {
    this.db.prepare(`
      UPDATE categories SET name = ?, description = ? WHERE id = ?
    `).run(name, description, id);
  }

  deleteCategory(id) {
    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  // ==================== PRODUCTS ====================
  getAllProducts(searchTerm = '', categoryId = null) {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;
    const params = [];

    const conditions = [];
    if (searchTerm) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY c.name, p.name';

    return this.db.prepare(query).all(...params);
  }

  createProduct(name, categoryId, price, description, ghostPoints = 0) {
    const result = this.db.prepare(`
      INSERT INTO products (name, category_id, price, description, ghost_points)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, categoryId, price, description, ghostPoints);
    return result.lastInsertRowid;
  }

  updateProduct(id, name, categoryId, price, description, ghostPoints = 0) {
    this.db.prepare(`
      UPDATE products SET name = ?, category_id = ?, price = ?, description = ?, ghost_points = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, categoryId, price, description, ghostPoints, id);
  }

  deleteProduct(id) {
    // Check if product has transactions
    const hasTransactions = this.db.prepare(
      'SELECT COUNT(*) as count FROM transactions WHERE product_id = ?'
    ).get(id).count > 0;
    
    if (hasTransactions) {
      throw new Error('Cannot delete product with existing transactions. Consider deactivating it instead.');
    }
    
    this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  // ==================== TRANSACTIONS ====================
  getClientTransactions(clientId) {
    return this.db.prepare(`
      SELECT t.*, p.name as product_name, u.full_name as created_by_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users u ON t.created_by = u.id
      WHERE t.client_id = ?
      ORDER BY t.created_at DESC
    `).all(clientId);
  }

  getAllTransactions(limit = 100) {
    return this.db.prepare(`
      SELECT t.*, p.name as product_name, c.name as client_name, u.full_name as created_by_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN clients c ON t.client_id = c.id
      JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(limit);
  }

  createTransaction(clientId, productId, quantity, unitPrice, createdBy) {
    const totalAmount = quantity * unitPrice;
    const result = this.db.prepare(`
      INSERT INTO transactions (client_id, product_id, quantity, unit_price, total_amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clientId, productId, quantity, unitPrice, totalAmount, createdBy);
    return result.lastInsertRowid;
  }

  deleteTransaction(id) {
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  }

  // ==================== PAYMENTS ====================
  getClientPayments(clientId) {
    return this.db.prepare(`
      SELECT p.*, u.full_name as created_by_name
      FROM payments p
      JOIN users u ON p.created_by = u.id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
    `).all(clientId);
  }

  getAllPayments(limit = 100) {
    return this.db.prepare(`
      SELECT p.*, c.name as client_name, u.full_name as created_by_name
      FROM payments p
      JOIN clients c ON p.client_id = c.id
      JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(limit);
  }

  createPayment(clientId, amount, paymentMethod, notes, createdBy) {
    const result = this.db.prepare(`
      INSERT INTO payments (client_id, amount, payment_method, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(clientId, amount, paymentMethod, notes, createdBy);
    return result.lastInsertRowid;
  }

  deletePayment(id) {
    this.db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  }

  // ==================== PAYMENT ALERTS ====================
  getAllAlerts() {
    return this.db.prepare(`
      SELECT a.*, c.name as client_name
      FROM payment_alerts a
      JOIN clients c ON a.client_id = c.id
      ORDER BY a.due_date ASC
    `).all();
  }

  getOverdueAlerts() {
    return this.db.prepare(`
      SELECT a.*, c.name as client_name
      FROM payment_alerts a
      JOIN clients c ON a.client_id = c.id
      WHERE a.due_date <= date('now') AND a.is_notified = 0
      ORDER BY a.due_date ASC
    `).all();
  }

  createAlert(clientId, dueDate, amount, notes, createdBy) {
    const result = this.db.prepare(`
      INSERT INTO payment_alerts (client_id, due_date, amount, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(clientId, dueDate, amount, notes, createdBy);
    return result.lastInsertRowid;
  }

  markAlertNotified(id) {
    this.db.prepare('UPDATE payment_alerts SET is_notified = 1 WHERE id = ?').run(id);
  }

  deleteAlert(id) {
    this.db.prepare('DELETE FROM payment_alerts WHERE id = ?').run(id);
  }

  // ==================== RANKS (GhostPoints System) ====================
  getAllRanks() {
    return this.db.prepare('SELECT * FROM ranks ORDER BY min_points ASC').all();
  }

  getRankById(id) {
    return this.db.prepare('SELECT * FROM ranks WHERE id = ?').get(id);
  }

  createRank(name, minPoints, discountPercent, color, sortOrder) {
    const result = this.db.prepare(`
      INSERT INTO ranks (name, min_points, discount_percent, color, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, minPoints, discountPercent, color, sortOrder);
    return result.lastInsertRowid;
  }

  updateRank(id, name, minPoints, discountPercent, color, sortOrder) {
    this.db.prepare(`
      UPDATE ranks SET name = ?, min_points = ?, discount_percent = ?, color = ?, sort_order = ?
      WHERE id = ?
    `).run(name, minPoints, discountPercent, color, sortOrder, id);
  }

  deleteRank(id) {
    this.db.prepare('DELETE FROM ranks WHERE id = ?').run(id);
  }

  getClientRank(totalPoints) {
    // Get the highest rank that the client qualifies for
    return this.db.prepare(`
      SELECT * FROM ranks 
      WHERE min_points <= ? 
      ORDER BY min_points DESC 
      LIMIT 1
    `).get(totalPoints);
  }

  getNextRank(totalPoints) {
    // Get the next rank the client needs to reach
    return this.db.prepare(`
      SELECT * FROM ranks 
      WHERE min_points > ? 
      ORDER BY min_points ASC 
      LIMIT 1
    `).get(totalPoints);
  }

  addPointsToClient(clientId, points) {
    this.db.prepare(`
      UPDATE clients SET total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(points, clientId);
    
    // Return updated client
    return this.getClientById(clientId);
  }

  getClientPoints(clientId) {
    const client = this.db.prepare('SELECT total_points FROM clients WHERE id = ?').get(clientId);
    return client ? client.total_points : 0;
  }

  seedDefaultRanks() {
    // Create default ranks if none exist
    const rankCount = this.db.prepare('SELECT COUNT(*) as count FROM ranks').get();
    if (rankCount.count === 0) {
      const defaultRanks = [
        { name: 'Newcomer', minPoints: 0, discount: 0, color: '#808080', order: 1 },
        { name: 'Bronze', minPoints: 100, discount: 2, color: '#cd7f32', order: 2 },
        { name: 'Silver', minPoints: 300, discount: 5, color: '#c0c0c0', order: 3 },
        { name: 'Gold', minPoints: 600, discount: 8, color: '#ffd700', order: 4 },
        { name: 'Platinum', minPoints: 1000, discount: 12, color: '#e5e4e2', order: 5 },
        { name: 'Diamond', minPoints: 2000, discount: 15, color: '#b9f2ff', order: 6 },
        { name: 'Ghost', minPoints: 5000, discount: 20, color: '#00ff41', order: 7 },
      ];
      const stmt = this.db.prepare(`
        INSERT INTO ranks (name, min_points, discount_percent, color, sort_order) 
        VALUES (?, ?, ?, ?, ?)
      `);
      defaultRanks.forEach(rank => stmt.run(rank.name, rank.minPoints, rank.discount, rank.color, rank.order));
    }
  }

  // ==================== DASHBOARD STATS ====================
  getDashboardStats() {
    const totalClients = this.db.prepare('SELECT COUNT(*) as count FROM clients').get().count;

    // Calculate total outstanding properly by getting sums separately to avoid double counting
    const totalTransactions = this.db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions
    `).get().total;
    
    const totalPayments = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
    `).get().total;
    
    const totalOutstanding = totalTransactions - totalPayments;

    const overdueAlerts = this.db.prepare(`
      SELECT COUNT(*) as count FROM payment_alerts
      WHERE due_date <= date('now') AND is_notified = 0
    `).get().count;

    const currentMonthEarnings = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get().total;

    return {
      totalClients,
      totalOutstanding: totalOutstanding || 0,
      overdueAlerts,
      currentMonthEarnings: currentMonthEarnings || 0
    };
  }

  // ==================== PCS ====================
  getAllPCs() {
    return this.db.prepare('SELECT * FROM pcs ORDER BY name').all();
  }

  getActivePCs() {
    return this.db.prepare('SELECT * FROM pcs WHERE is_active = 1 ORDER BY name').all();
  }

  createPC(name, description) {
    const result = this.db.prepare(`
      INSERT INTO pcs (name, description) VALUES (?, ?)
    `).run(name, description);
    return result.lastInsertRowid;
  }

  updatePC(id, name, description, isActive) {
    this.db.prepare(`
      UPDATE pcs SET name = ?, description = ?, is_active = ? WHERE id = ?
    `).run(name, description, isActive ? 1 : 0, id);
  }

  deletePC(id) {
    this.db.prepare('DELETE FROM pcs WHERE id = ?').run(id);
  }

  // ==================== RESERVATIONS ====================
  getAllReservations() {
    return this.db.prepare(`
      SELECT r.*, c.name as client_name, p.name as pc_name, u.full_name as created_by_name
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN pcs p ON r.pc_id = p.id
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.start_time DESC
    `).all();
  }

  getReservationsByDateRange(startDate, endDate) {
    return this.db.prepare(`
      SELECT r.*, c.name as client_name, c.phone as client_phone, 
             p.name as pc_name, u.full_name as created_by_name
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN pcs p ON r.pc_id = p.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.start_time <= ? AND r.end_time >= ?
      ORDER BY r.start_time ASC
    `).all(endDate, startDate);
  }

  getReservationsByClient(clientId) {
    return this.db.prepare(`
      SELECT r.*, p.name as pc_name, u.full_name as created_by_name
      FROM reservations r
      LEFT JOIN pcs p ON r.pc_id = p.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.client_id = ?
      ORDER BY r.start_time DESC
    `).all(clientId);
  }

  getUpcomingReservations(limit = 10) {
    return this.db.prepare(`
      SELECT r.*, c.name as client_name, p.name as pc_name
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN pcs p ON r.pc_id = p.id
      WHERE r.start_time >= datetime('now')
      ORDER BY r.start_time ASC
      LIMIT ?
    `).all(limit);
  }

  checkReservationConflict(pcId, startTime, endTime, excludeId = null) {
    const query = excludeId
      ? `SELECT COUNT(*) as count FROM reservations 
         WHERE pc_id = ? AND id != ? 
         AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) 
         OR (start_time >= ? AND end_time <= ?))`
      : `SELECT COUNT(*) as count FROM reservations 
         WHERE pc_id = ? 
         AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) 
         OR (start_time >= ? AND end_time <= ?))`;

    const params = excludeId
      ? [pcId, excludeId, endTime, startTime, endTime, startTime, startTime, endTime]
      : [pcId, endTime, startTime, endTime, startTime, startTime, endTime];

    return this.db.prepare(query).get(...params).count > 0;
  }

  createReservation(clientId, pcId, startTime, endTime, notes, createdBy, googleEventId = null) {
    const result = this.db.prepare(`
      INSERT INTO reservations (client_id, pc_id, start_time, end_time, notes, google_event_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(clientId, pcId, startTime, endTime, notes, googleEventId, createdBy);
    return result.lastInsertRowid;
  }

  updateReservation(id, clientId, pcId, startTime, endTime, notes, googleEventId = null) {
    this.db.prepare(`
      UPDATE reservations 
      SET client_id = ?, pc_id = ?, start_time = ?, end_time = ?, notes = ?, 
          google_event_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(clientId, pcId, startTime, endTime, notes, googleEventId, id);
  }

  deleteReservation(id) {
    this.db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
  }

  getReservationById(id) {
    return this.db.prepare(`
      SELECT r.*, c.name as client_name, c.phone as client_phone, c.email as client_email,
             p.name as pc_name, u.full_name as created_by_name
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN pcs p ON r.pc_id = p.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(id);
  }

  // ==================== GOOGLE CALENDAR CONFIG ====================
  getGoogleCalendarConfig() {
    return this.db.prepare('SELECT * FROM google_calendar_config WHERE id = 1').get();
  }

  saveGoogleCalendarConfig(accessToken, refreshToken, tokenExpiry, calendarId) {
    const existing = this.getGoogleCalendarConfig();
    if (existing) {
      this.db.prepare(`
        UPDATE google_calendar_config 
        SET access_token = ?, refresh_token = ?, token_expiry = ?, calendar_id = ?, 
            is_enabled = 1, last_sync = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(accessToken, refreshToken, tokenExpiry, calendarId);
    } else {
      this.db.prepare(`
        INSERT INTO google_calendar_config (id, access_token, refresh_token, token_expiry, calendar_id, is_enabled)
        VALUES (1, ?, ?, ?, ?, 1)
      `).run(accessToken, refreshToken, tokenExpiry, calendarId);
    }
  }

  updateGoogleCalendarTokens(accessToken, tokenExpiry) {
    this.db.prepare(`
      UPDATE google_calendar_config 
      SET access_token = ?, token_expiry = ?, last_sync = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(accessToken, tokenExpiry);
  }

  disableGoogleCalendar() {
    this.db.prepare('UPDATE google_calendar_config SET is_enabled = 0 WHERE id = 1').run();
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
