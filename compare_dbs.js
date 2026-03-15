const Database = require('better-sqlite3');
const path = require('path');

const folders = ['school-management', 'Electron'];
const res = [];

folders.forEach(folder => {
  const dbPath = `C:\\Users\\idrees.kema\\AppData\\Roaming\\${folder}\\school.db`;
  try {
    const db = new Database(dbPath);
    const count = db.prepare('SELECT COUNT(*) as cnt FROM students').get();
    res.push({ folder, count: count.cnt });
    db.close();
  } catch (e) {
    res.push({ folder, error: e.message });
  }
});

console.log(JSON.stringify(res, null, 2));
