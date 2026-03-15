const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'school.db');
  console.log('User Data Path:', userDataPath);
  console.log('DB Path:', dbPath);
  console.log('DB exists:', fs.existsSync(dbPath));

  try {
    const db = new Database(dbPath);
    console.log('Connected to DB');
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tableInfo.map(t => t.name).join(', '));
    
    const collections = ['students', 'employees', 'classes', 'library_books', 'library_issues', 'fees', 'attendance', 'settings'];
    collections.forEach(table => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get();
        console.log(`Table ${table} count:`, count.cnt);
      } catch (e) {
        console.log(`Table ${table} check failed:`, e.message);
      }
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
  app.quit();
});
