import XLSX from 'xlsx'

export function register(ipcMain, db) {
  ipcMain.handle('students:getAll', (_, filters = {}) => {
    try {
      let query = `
        SELECT s.*, c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE 1=1
      `
      const params = []

      if (filters.class_id) {
        query += ' AND s.class_id = ?'
        params.push(filters.class_id)
      }
      if (filters.section) {
        query += ' AND s.section = ?'
        params.push(filters.section)
      }
      if (filters.status) {
        query += ' AND s.status = ?'
        params.push(filters.status)
      }
      if (filters.search) {
        query += ' AND (s.name LIKE ? OR s.admission_no LIKE ? OR s.phone LIKE ?)'
        const term = `%${filters.search}%`
        params.push(term, term, term)
      }

      query += ' ORDER BY s.created_at DESC'

      if (filters.limit) {
        query += ' LIMIT ?'
        params.push(filters.limit)
      }
      if (filters.offset) {
        query += ' OFFSET ?'
        params.push(filters.offset)
      }

      const rows = db.prepare(query).all(...params)
      console.log(`[IPC] students:getAll found ${rows.length} rows`);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM students s WHERE 1=1'
      const countParams = []
      if (filters.class_id) { countQuery += ' AND s.class_id = ?'; countParams.push(filters.class_id) }
      if (filters.section) { countQuery += ' AND s.section = ?'; countParams.push(filters.section) }
      if (filters.status) { countQuery += ' AND s.status = ?'; countParams.push(filters.status) }
      if (filters.search) {
        countQuery += ' AND (s.name LIKE ? OR s.admission_no LIKE ? OR s.phone LIKE ?)'
        const term = `%${filters.search}%`
        countParams.push(term, term, term)
      }

      const { total } = db.prepare(countQuery).get(...countParams)
      console.log(`[IPC] students:getAll total count: ${total}`);
      return { success: true, data: rows, total }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('students:getById', (_, id) => {
    try {
      const row = db.prepare(`
        SELECT s.*, c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
      `).get(id)
      return { success: true, data: row }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('students:create', (_, data) => {
    try {
      // Auto-generate admission number
      const year = new Date().getFullYear()
      const lastAdm = db.prepare(
        "SELECT admission_no FROM students WHERE admission_no LIKE ? ORDER BY id DESC LIMIT 1"
      ).get(`ADM${year}%`)

      let nextNum = 1
      if (lastAdm) {
        const match = lastAdm.admission_no.match(/ADM\d+(\d{3})$/)
        if (match) nextNum = parseInt(match[1]) + 1
      }
      const admissionNo = `ADM${year}${String(nextNum).padStart(3, '0')}`

      const stmt = db.prepare(`
        INSERT INTO students
          (admission_no, name, father_name, mother_name, dob, gender, class_id, section,
           address, phone, email, photo_path, admission_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        data.admission_no || admissionNo,
        data.name,
        data.father_name || null,
        data.mother_name || null,
        data.dob || null,
        data.gender || 'Male',
        data.class_id || null,
        data.section || 'A',
        data.address || null,
        data.phone || null,
        data.email || null,
        data.photo_path || null,
        data.admission_date || new Date().toISOString().split('T')[0],
        data.status || 'Active'
      )

      const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid)
      return { success: true, data: newStudent }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('students:update', (_, id, data) => {
    try {
      const fields = []
      const values = []

      const allowedFields = [
        'name', 'father_name', 'mother_name', 'dob', 'gender', 'class_id',
        'section', 'address', 'phone', 'email', 'photo_path', 'admission_date',
        'status', 'admission_no'
      ]

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`)
          values.push(data[field])
        }
      })

      if (fields.length === 0) return { success: false, error: 'No fields to update' }

      values.push(id)
      db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`).run(...values)

      const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('students:delete', (_, id) => {
    try {
      db.prepare('DELETE FROM attendance WHERE student_id = ?').run(id)
      db.prepare('DELETE FROM fees WHERE student_id = ?').run(id)
      db.prepare('DELETE FROM library_issues WHERE student_id = ?').run(id)
      db.prepare('DELETE FROM students WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('students:importFromExcel', (_, filePath, columnMap) => {
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      let imported = 0
      let skipped = 0
      const errors = []

      const year = new Date().getFullYear()
      const lastAdm = db.prepare(
        "SELECT admission_no FROM students WHERE admission_no LIKE ? ORDER BY id DESC LIMIT 1"
      ).get(`ADM${year}%`)
      let nextNum = 1
      if (lastAdm) {
        const match = lastAdm.admission_no.match(/ADM\d+(\d{3,})$/)
        if (match) nextNum = parseInt(match[1]) + 1
      }

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO students
          (admission_no, name, father_name, mother_name, dob, gender, section, address, phone, email, admission_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const importTx = db.transaction((rows) => {
        rows.forEach((row, idx) => {
          try {
            const mapped = {}
            Object.entries(columnMap).forEach(([dbField, excelCol]) => {
              mapped[dbField] = excelCol ? String(row[excelCol] || '').trim() : ''
            })

            if (!mapped.name) {
              errors.push(`Row ${idx + 2}: Missing name`)
              skipped++
              return
            }

            const admissionNo = mapped.admission_no || `ADM${year}${String(nextNum).padStart(3, '0')}`
            nextNum++

            const result = insertStmt.run(
              admissionNo,
              mapped.name,
              mapped.father_name || null,
              mapped.mother_name || null,
              mapped.dob || null,
              mapped.gender || 'Male',
              mapped.section || 'A',
              mapped.address || null,
              mapped.phone || null,
              mapped.email || null,
              mapped.admission_date || new Date().toISOString().split('T')[0],
              mapped.status || 'Active'
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
