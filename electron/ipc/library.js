import XLSX from 'xlsx'

export function register(ipcMain, db) {
  ipcMain.handle('library:getBooks', (_, filters = {}) => {
    try {
      let query = 'SELECT * FROM library_books WHERE 1=1'
      const params = []

      if (filters.search) {
        query += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR book_id LIKE ?)'
        const term = `%${filters.search}%`
        params.push(term, term, term, term)
      }
      if (filters.category) {
        query += ' AND category = ?'
        params.push(filters.category)
      }
      if (filters.available) {
        query += ' AND available_copies > 0'
      }

      query += ' ORDER BY title'

      const rows = db.prepare(query).all(...params)
      return { success: true, data: rows }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('library:addBook', (_, data) => {
    try {
      const year = new Date().getFullYear()
      const lastBook = db.prepare(
        "SELECT book_id FROM library_books ORDER BY id DESC LIMIT 1"
      ).get()

      let nextNum = 1
      if (lastBook) {
        const match = lastBook.book_id.match(/\d+$/)
        if (match) nextNum = parseInt(match[0]) + 1
      }

      const bookId = data.book_id || `BK${String(nextNum).padStart(3, '0')}`
      const copies = parseInt(data.total_copies) || 1

      const stmt = db.prepare(`
        INSERT INTO library_books (book_id, title, author, publisher, isbn, category, total_copies, available_copies)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        bookId,
        data.title,
        data.author || null,
        data.publisher || null,
        data.isbn || null,
        data.category || 'General',
        copies,
        copies
      )

      const newBook = db.prepare('SELECT * FROM library_books WHERE id = ?').get(result.lastInsertRowid)
      return { success: true, data: newBook }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('library:updateBook', (_, id, data) => {
    try {
      const allowedFields = ['title', 'author', 'publisher', 'isbn', 'category', 'total_copies', 'available_copies']
      const fields = []
      const values = []

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`)
          values.push(data[field])
        }
      })

      if (fields.length === 0) return { success: false, error: 'No fields to update' }

      values.push(id)
      db.prepare(`UPDATE library_books SET ${fields.join(', ')} WHERE id = ?`).run(...values)

      const updated = db.prepare('SELECT * FROM library_books WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('library:issueBook', (_, bookId, studentId, dueDate) => {
    try {
      // Check availability
      const book = db.prepare('SELECT * FROM library_books WHERE id = ?').get(bookId)
      if (!book) return { success: false, error: 'Book not found' }
      if (book.available_copies <= 0) return { success: false, error: 'No copies available' }

      // Check if student already has this book
      const existing = db.prepare(
        "SELECT id FROM library_issues WHERE book_id = ? AND student_id = ? AND status = 'Issued'"
      ).get(bookId, studentId)
      if (existing) return { success: false, error: 'Student already has this book issued' }

      const issueTx = db.transaction(() => {
        db.prepare('UPDATE library_books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId)
        const result = db.prepare(`
          INSERT INTO library_issues (book_id, student_id, issue_date, due_date, status)
          VALUES (?, ?, date('now'), ?, 'Issued')
        `).run(bookId, studentId, dueDate)
        return result.lastInsertRowid
      })

      const issueId = issueTx()
      const issue = db.prepare(`
        SELECT li.*, lb.title as book_title, lb.book_id as book_code, s.name as student_name
        FROM library_issues li
        JOIN library_books lb ON li.book_id = lb.id
        JOIN students s ON li.student_id = s.id
        WHERE li.id = ?
      `).get(issueId)

      return { success: true, data: issue }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('library:returnBook', (_, issueId) => {
    try {
      const issue = db.prepare('SELECT * FROM library_issues WHERE id = ?').get(issueId)
      if (!issue) return { success: false, error: 'Issue record not found' }
      if (issue.status === 'Returned') return { success: false, error: 'Book already returned' }

      // Calculate fine
      const finePerDay = parseFloat(
        (db.prepare("SELECT value FROM settings WHERE key = 'fine_per_day'").get() || {}).value || 2
      )
      const today = new Date()
      const dueDate = new Date(issue.due_date)
      let fine = 0

      if (today > dueDate) {
        const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
        fine = daysLate * finePerDay
      }

      const returnTx = db.transaction(() => {
        db.prepare(`
          UPDATE library_issues
          SET return_date = date('now'), status = 'Returned', fine_amount = ?
          WHERE id = ?
        `).run(fine, issueId)
        db.prepare('UPDATE library_books SET available_copies = available_copies + 1 WHERE id = ?').run(issue.book_id)
      })

      returnTx()

      const updated = db.prepare(`
        SELECT li.*, lb.title as book_title, lb.book_id as book_code, s.name as student_name
        FROM library_issues li
        JOIN library_books lb ON li.book_id = lb.id
        JOIN students s ON li.student_id = s.id
        WHERE li.id = ?
      `).get(issueId)

      return { success: true, data: updated, fine }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('library:getIssues', (_, filters = {}) => {
    try {
      let query = `
        SELECT li.*,
          lb.title as book_title,
          lb.book_id as book_code,
          lb.author as book_author,
          s.name as student_name,
          s.admission_no,
          CASE
            WHEN li.status = 'Issued' AND date('now') > li.due_date THEN 'Overdue'
            ELSE li.status
          END as display_status,
          CASE
            WHEN li.status = 'Issued' AND date('now') > li.due_date
            THEN CAST((julianday('now') - julianday(li.due_date)) AS INTEGER)
            ELSE 0
          END as days_overdue
        FROM library_issues li
        JOIN library_books lb ON li.book_id = lb.id
        JOIN students s ON li.student_id = s.id
        WHERE 1=1
      `
      const params = []

      if (filters.status === 'active') {
        query += " AND li.status = 'Issued'"
      } else if (filters.status === 'overdue') {
        query += " AND li.status = 'Issued' AND date('now') > li.due_date"
      } else if (filters.status === 'returned') {
        query += " AND li.status = 'Returned'"
      }

      if (filters.student_id) {
        query += ' AND li.student_id = ?'
        params.push(filters.student_id)
      }

      if (filters.search) {
        query += ' AND (lb.title LIKE ? OR s.name LIKE ? OR s.admission_no LIKE ?)'
        const term = `%${filters.search}%`
        params.push(term, term, term)
      }

      query += ' ORDER BY li.issue_date DESC'

      const rows = db.prepare(query).all(...params)
      return { success: true, data: rows }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('library:importBooks', (_, filePath, columnMap) => {
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      let imported = 0
      let skipped = 0
      const errors = []

      const lastBook = db.prepare("SELECT book_id FROM library_books ORDER BY id DESC LIMIT 1").get()
      let nextNum = 1
      if (lastBook) {
        const match = lastBook.book_id.match(/\d+$/)
        if (match) nextNum = parseInt(match[0]) + 1
      }

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO library_books
          (book_id, title, author, publisher, isbn, category, total_copies, available_copies)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const importTx = db.transaction((rows) => {
        rows.forEach((row, idx) => {
          try {
            const mapped = {}
            Object.entries(columnMap).forEach(([dbField, excelCol]) => {
              mapped[dbField] = excelCol ? String(row[excelCol] || '').trim() : ''
            })

            if (!mapped.title) {
              errors.push(`Row ${idx + 2}: Missing title`)
              skipped++
              return
            }

            const bookId = mapped.book_id || `BK${String(nextNum).padStart(3, '0')}`
            nextNum++
            const copies = parseInt(mapped.total_copies) || 1

            const result = insertStmt.run(
              bookId, mapped.title, mapped.author || null,
              mapped.publisher || null, mapped.isbn || null,
              mapped.category || 'General', copies, copies
            )

            if (result.changes > 0) imported++
            else skipped++
          } catch (rowErr) {
            errors.push(`Row ${idx + 2}: ${rowErr.message}`)
            skipped++
          }
        })
      })

      importTx(rows)
      return { success: true, imported, skipped, errors }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

module.exports = { register }
