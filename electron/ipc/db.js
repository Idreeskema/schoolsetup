import Database from 'better-sqlite3'

let db

export function initDb(dbPath) {
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables()
  insertDefaultData()

  return db
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      section TEXT NOT NULL DEFAULT 'A',
      class_teacher_id INTEGER,
      capacity INTEGER DEFAULT 40,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(name, section)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admission_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      father_name TEXT,
      mother_name TEXT,
      dob TEXT,
      gender TEXT DEFAULT 'Male',
      class_id INTEGER REFERENCES classes(id),
      section TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      photo_path TEXT,
      admission_date TEXT DEFAULT (date('now')),
      status TEXT DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      designation TEXT,
      department TEXT,
      dob TEXT,
      gender TEXT DEFAULT 'Male',
      phone TEXT,
      email TEXT,
      address TEXT,
      joining_date TEXT DEFAULT (date('now')),
      salary REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      qualification TEXT,
      photo_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS library_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      isbn TEXT,
      category TEXT,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      added_date TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS library_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER REFERENCES library_books(id),
      student_id INTEGER REFERENCES students(id),
      issue_date TEXT DEFAULT (date('now')),
      due_date TEXT NOT NULL,
      return_date TEXT,
      fine_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'Issued'
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      class_id INTEGER REFERENCES classes(id),
      date TEXT NOT NULL,
      status TEXT DEFAULT 'Present',
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      fee_type TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      paid_date TEXT,
      status TEXT DEFAULT 'Pending',
      receipt_no TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

function insertDefaultData() {
  // Default settings
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get()
  if (existingSettings.count === 0) {
    const settingsData = [
      ['school_name', 'Springfield Academy'],
      ['school_address', '123 Education Lane, Springfield, ST 12345'],
      ['school_phone', '+1 (555) 123-4567'],
      ['school_email', 'info@springfieldacademy.edu'],
      ['academic_year', '2024-2025'],
      ['fine_per_day', '2.00'],
      ['currency', 'USD'],
      ['logo_path', '']
    ]

    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
    settingsData.forEach(([key, value]) => insertSetting.run(key, value))
  }

  // Default classes
  const classesCount = db.prepare('SELECT COUNT(*) as count FROM classes').get()
  if (classesCount.count === 0) {
    const classList = [
      ['Grade 1', 'A', 35],
      ['Grade 2', 'A', 38],
      ['Grade 3', 'A', 40],
      ['Grade 4', 'A', 36],
      ['Grade 5', 'A', 34],
      ['Grade 6', 'A', 32],
      ['Grade 7', 'A', 30],
      ['Grade 8', 'A', 28]
    ]
    const insertClass = db.prepare('INSERT OR IGNORE INTO classes (name, section, capacity) VALUES (?, ?, ?)')
    classList.forEach(([name, section, capacity]) => insertClass.run(name, section, capacity))
  }

  // Sample employees
  const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get()
  if (empCount.count === 0) {
    const employees = [
      ['EMP001', 'John Smith', 'Principal', 'Administration', '1975-05-15', 'Male', '555-0101', 'jsmith@school.edu', '10 Oak Ave', '2010-01-15', 85000, 'Active', 'Ph.D Education'],
      ['EMP002', 'Sarah Johnson', 'Teacher', 'Mathematics', '1982-08-22', 'Female', '555-0102', 'sjohnson@school.edu', '22 Pine St', '2015-07-01', 55000, 'Active', 'M.Sc Mathematics'],
      ['EMP003', 'Michael Brown', 'Teacher', 'Science', '1980-03-10', 'Male', '555-0103', 'mbrown@school.edu', '45 Elm Rd', '2012-08-01', 58000, 'Active', 'M.Sc Physics'],
      ['EMP004', 'Emily Davis', 'Teacher', 'English', '1985-11-30', 'Female', '555-0104', 'edavis@school.edu', '8 Maple Ave', '2018-07-15', 52000, 'Active', 'M.A English Literature'],
      ['EMP005', 'Robert Wilson', 'Librarian', 'Library', '1978-07-20', 'Male', '555-0105', 'rwilson@school.edu', '33 Cedar Ln', '2011-01-10', 45000, 'Active', 'B.Lib Science']
    ]
    const insertEmp = db.prepare(`INSERT OR IGNORE INTO employees
      (emp_id, name, designation, department, dob, gender, phone, email, address, joining_date, salary, status, qualification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    employees.forEach(e => insertEmp.run(...e))
  }

  // Sample students
  const studCount = db.prepare('SELECT COUNT(*) as count FROM students').get()
  if (studCount.count === 0) {
    const students = [
      ['ADM2024001', 'Alice Cooper', 'Bob Cooper', 'Mary Cooper', '2013-04-12', 'Female', 1, 'A', '12 Birch St', '555-1001', 'alice@example.com', '2024-01-10', 'Active'],
      ['ADM2024002', 'Tom Harris', 'James Harris', 'Linda Harris', '2012-09-25', 'Male', 2, 'A', '7 Walnut Ave', '555-1002', 'tom@example.com', '2024-01-10', 'Active'],
      ['ADM2024003', 'Emma Watson', 'Richard Watson', 'Kate Watson', '2011-06-18', 'Female', 3, 'A', '55 Ash Blvd', '555-1003', 'emma@example.com', '2024-01-10', 'Active'],
      ['ADM2024004', 'Liam Johnson', 'David Johnson', 'Susan Johnson', '2010-02-14', 'Male', 4, 'A', '29 Cherry Ln', '555-1004', 'liam@example.com', '2024-01-10', 'Active'],
      ['ADM2024005', 'Olivia Martin', 'Frank Martin', 'Grace Martin', '2009-11-07', 'Female', 5, 'A', '16 Poplar Dr', '555-1005', 'olivia@example.com', '2024-01-10', 'Active'],
      ['ADM2024006', 'Noah Clark', 'George Clark', 'Helen Clark', '2013-08-30', 'Male', 1, 'A', '41 Spruce Ct', '555-1006', 'noah@example.com', '2024-01-15', 'Active'],
      ['ADM2024007', 'Sophia Lee', 'Kevin Lee', 'Amy Lee', '2012-01-22', 'Female', 2, 'A', '3 Hickory Way', '555-1007', 'sophia@example.com', '2024-01-15', 'Active'],
      ['ADM2024008', 'James Anderson', 'Paul Anderson', 'Ruth Anderson', '2011-05-05', 'Male', 3, 'A', '88 Willow Blvd', '555-1008', 'james@example.com', '2024-01-15', 'Active'],
      ['ADM2024009', 'Ava Taylor', 'Mark Taylor', 'Diane Taylor', '2010-12-16', 'Female', 4, 'A', '22 Magnolia St', '555-1009', 'ava@example.com', '2024-01-20', 'Active'],
      ['ADM2024010', 'William Moore', 'Steven Moore', 'Carol Moore', '2009-07-03', 'Male', 5, 'A', '67 Sycamore Rd', '555-1010', 'william@example.com', '2024-01-20', 'Active']
    ]
    const insertStudent = db.prepare(`INSERT OR IGNORE INTO students
      (admission_no, name, father_name, mother_name, dob, gender, class_id, section, address, phone, email, admission_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    students.forEach(s => insertStudent.run(...s))
  }

  // Sample library books
  const booksCount = db.prepare('SELECT COUNT(*) as count FROM library_books').get()
  if (booksCount.count === 0) {
    const books = [
      ['BK001', 'Mathematics Grade 5', 'John Doe', 'EduPress', '978-0-000001-0', 'Textbook', 5, 5],
      ['BK002', 'Science Fundamentals', 'Jane Smith', 'SciPub', '978-0-000002-0', 'Textbook', 4, 4],
      ['BK003', 'English Grammar', 'Emily Brown', 'LangArts', '978-0-000003-0', 'Textbook', 6, 6],
      ['BK004', 'History of the World', 'Michael Green', 'HistPress', '978-0-000004-0', 'Reference', 3, 3],
      ['BK005', 'Introduction to Computers', 'Alice White', 'TechPub', '978-0-000005-0', 'Textbook', 4, 4],
      ['BK006', 'The Great Adventure', 'Robert Black', 'FictionHouse', '978-0-000006-0', 'Fiction', 3, 3],
      ['BK007', 'Art and Creativity', 'Sarah Blue', 'ArtPress', '978-0-000007-0', 'Art', 2, 2],
      ['BK008', 'Geography Atlas', 'David Yellow', 'GeoBooks', '978-0-000008-0', 'Reference', 5, 5],
      ['BK009', 'Physics Principles', 'Laura Red', 'SciPub', '978-0-000009-0', 'Textbook', 3, 3],
      ['BK010', 'Environmental Studies', 'Chris Gray', 'EduPress', '978-0-000010-0', 'Reference', 4, 4]
    ]
    const insertBook = db.prepare(`INSERT OR IGNORE INTO library_books
      (book_id, title, author, publisher, isbn, category, total_copies, available_copies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    books.forEach(b => insertBook.run(...b))
  }

  // Sample fee records
  const feesCount = db.prepare('SELECT COUNT(*) as count FROM fees').get()
  if (feesCount.count === 0) {
    const feeTypes = ['Tuition', 'Activity', 'Library', 'Transport']
    const amounts = [500, 100, 50, 150]
    const students = db.prepare('SELECT id FROM students LIMIT 10').all()
    let receiptCounter = 1

    const insertFee = db.prepare(`INSERT OR IGNORE INTO fees
      (student_id, fee_type, amount, due_date, paid_date, status, receipt_no)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)

    students.forEach((s, idx) => {
      feeTypes.forEach((type, tIdx) => {
        const status = (idx + tIdx) % 3 === 0 ? 'Pending' : 'Paid'
        const dueDate = '2024-03-31'
        const paidDate = status === 'Paid' ? '2024-03-15' : null
        const receiptNo = status === 'Paid' ? `RCP${String(receiptCounter++).padStart(5, '0')}` : null
        insertFee.run(s.id, type, amounts[tIdx], dueDate, paidDate, status, receiptNo)
      })
    })
  }
}

module.exports = { initDb }
