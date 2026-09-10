const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to your local POS SQLite database
const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to local SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // 1. Create the users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'cashier')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table verified/created successfully.');
        seedAdminUser();
      }
    });
  });
}

function seedAdminUser() {
  // Check if an admin already exists to avoid duplicate entries
  db.get(`SELECT * FROM users WHERE role = 'admin'`, (err, row) => {
    if (err) {
      console.error('Error checking for existing admin:', err.message);
      db.close();
      return;
    }

    if (!row) {
      // Insert a default Manager account with PIN "1234"
      const stmt = db.prepare(`INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)`);
      stmt.run('Head Manager', '1234', 'admin', (err) => {
        if (err) {
          console.error('Error seeding admin user:', err.message);
        } else {
          console.log('--------------------------------------------------');
          console.log(' SUCCESS: Default Admin account created!');
          console.log(' Name: Head Manager');
          console.log(' Role: admin');
          console.log(' PIN Code: 1234 (Use this in your UI modal to test)');
          console.log('--------------------------------------------------');
        }
        stmt.finalize();
        db.close();
      });
    } else {
      console.log('Admin user already exists in the database. Skipping seed.');
      db.close();
    }
  });
}