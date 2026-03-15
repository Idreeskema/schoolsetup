const Database = require('better-sqlite3');
const path = require('path');
const userData = 'C:\\Users\\idrees.kema\\AppData\\Roaming\\school-management';
const dbPath = path.join(userData, 'school.db');

try {
  const db = new Database(dbPath);
  console.log('Connected to DB');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));
  
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get();
  console.log('Student count:', studentCount.count);
  
  const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get();
  console.log('Class count:', classCount.count);
  
  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  console.log('Employee count:', employeeCount.count);

  const bookCount = db.prepare('SELECT COUNT(*) as count FROM library_books').get();
  console.log('Book count:', bookCount.count);
  
} catch (err) {
  console.error('Error checking DB:', err.message);
}
