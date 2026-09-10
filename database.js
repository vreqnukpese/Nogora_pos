const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Creates a local 'pos.db' file in your project folder
const dbFile = path.resolve(__dirname, 'pos.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the local SQLite database.');
  }
});

// Initialize tables
db.serialize(() => {
  // Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number INTEGER NOT NULL,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Products table for the menu
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL
    )
  `, () => {
    // Seed initial menu items if the table is empty
    db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
      if (row && row.count === 0) {
        const sampleProducts = [
          ['jollof_chicken', 'Jollof Rice & Chicken', 45.00, 'Main'],
          ['fried_rice_fish', 'Fried Rice & Fish', 50.00, 'Main'],
          ['banku_tilapia', 'Banku & Tilapia', 70.00, 'Main'],
          ['indomie_chicken', 'Indomie with chicken', 30.00, 'noodles'],
          ['indomie_egg', 'Indomie with egg', 30.00, 'noodles'],
          ['indomie_mixed', 'Indomie mixed egg', 50.00, 'noodles'],
          ['spaghetti_chicken', 'Spaghetti with chicken', 30.00, 'pasta'],
          ['spaghetti_egg', 'Spaghetti with egg', 30.00, 'pasta'],
          ['spaghetti_mixed', 'Spaghetti mixed egg', 50.00, 'pasta'],
          ['salad_small', 'Salad (small)', 40.00, 'salads'],
          ['salad_large', 'Salad (large)', 50.00, 'salads'],
          ['coca_cola', 'Coca-Cola', 10.00, 'Drinks'],
          ['water', 'Bottled Water', 5.00, 'Drinks'],
          ['plantain', 'Fried Plantain', 15.00, 'Sides']
        ];
        
        const stmt = db.prepare(`INSERT INTO products (product_id, name, price, category) VALUES (?, ?, ?, ?)`);
        sampleProducts.forEach(prod => stmt.run(prod));
        stmt.finalize();
        console.log('Complete restaurant menu seeded into database.');
      }
    });
  });
});

// Function to get all menu products
function getAllProducts(callback) {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    callback(err, rows);
  });
}

// Function to get the next ticket number for *today*
function getNextTicketNumber(callback) {
  const today = new Date().toISOString().split('T')[0]; // e.g., '2026-09-09'
  const query = `SELECT MAX(ticket_number) as maxNum FROM orders WHERE date(created_at) = ?`;
  
  db.get(query, [today], (err, row) => {
    if (err) {
      return callback(err, 1);
    }
    const nextNum = (row && row.maxNum) ? row.maxNum + 1 : 1;
    callback(null, nextNum);
  });
}

// Function to save a new order
function saveOrder(ticketNumber, items, total, paymentMethod, callback) {
  const now = new Date().toISOString();
  const query = `INSERT INTO orders (ticket_number, items, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(query, [ticketNumber, JSON.stringify(items), total, paymentMethod, now], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

module.exports = { db, getAllProducts, getNextTicketNumber, saveOrder };
