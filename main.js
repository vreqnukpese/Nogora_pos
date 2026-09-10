const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Initialize or connect to your local SQLite database file
const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to local SQLite database.');
  }
});

// 2. Listen for the PIN verification request from the frontend UI
ipcMain.handle('verify-pin', async (event, pin) => {
  return new Promise((resolve) => {
    // Query the database for an admin with this matching PIN
    const query = `SELECT id, name, role FROM users WHERE pin_code = ? AND role = 'admin'`;
    
    db.get(query, [pin], (err, row) => {
      if (err) {
        console.error('Database error during PIN check:', err.message);
        resolve({ authorized: false, message: "Database error occurred." });
      } else if (!row) {
        // No matching admin found
        resolve({ authorized: false, message: "Invalid Manager PIN or insufficient permissions." });
      } else {
        // Match found! Return success and basic manager info for auditing
        resolve({ authorized: true, admin: row });
      }
    });
  });
});

// 3. Create the desktop window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
  
}

// 4. App lifecycle listeners
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});