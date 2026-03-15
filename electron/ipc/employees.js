import XLSX from 'xlsx'

export function register(ipcMain, db) {
  ipcMain.handle('employees:getAll', (_, filters = {}) => {
    try {
      let query = 'SELECT * FROM employees WHERE 1=1'
      const params = []

      if (filters.department) {
        query += ' AND department = ?'
        params.push(filters.department)
      }
      if (filters.designation) {
        query += ' AND designation = ?'
        params.push(filters.designation)
      }
      if (filters.status) {
        query += ' AND status = ?'
        params.push(filters.status)
      }
      if (filters.search) {
        query += ' AND (name LIKE ? OR emp_id LIKE ? OR phone LIKE ? OR email LIKE ?)'
        const term = `%${filters.search}%`
        params.push(term, term, term, term)
      }

      query += ' ORDER BY created_at DESC'

      if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit) }
      if (filters.offset) { query += ' OFFSET ?'; params.push(filters.offset) }

      const rows = db.prepare(query).all(...params)

      let countQuery = 'SELECT COUNT(*) as total FROM employees WHERE 1=1'
      const countParams = []
      if (filters.department) { countQuery += ' AND department = ?'; countParams.push(filters.department) }
      if (filters.designation) { countQuery += ' AND designation = ?'; countParams.push(filters.designation) }
      if (filters.status) { countQuery += ' AND status = ?'; countParams.push(filters.status) }
      if (filters.search) {
        countQuery += ' AND (name LIKE ? OR emp_id LIKE ? OR phone LIKE ? OR email LIKE ?)'
        const term = `%${filters.search}%`
        countParams.push(term, term, term, term)
      }

      const { total } = db.prepare(countQuery).get(...countParams)
      return { success: true, data: rows, total }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('employees:getById', (_, id) => {
    try {
      const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('employees:create', (_, data) => {
    try {
      const year = new Date().getFullYear()
      const lastEmp = db.prepare(
        "SELECT emp_id FROM employees WHERE emp_id LIKE ? ORDER BY id DESC LIMIT 1"
      ).get(`EMP${year}%`)

      let nextNum = 1
      if (lastEmp) {
        const match = lastEmp.emp_id.match(/EMP\d+(\d{3,})$/)
        if (match) nextNum = parseInt(match[1]) + 1
      } else {
        const anyLast = db.prepare("SELECT emp_id FROM employees ORDER BY id DESC LIMIT 1").get()
        if (anyLast) {
          const match = anyLast.emp_id.match(/\d+$/)
          if (match) nextNum = parseInt(match[0]) + 1
        }
      }

      const empId = data.emp_id || `EMP${year}${String(nextNum).padStart(3, '0')}`

      const stmt = db.prepare(`
        INSERT INTO employees
          (emp_id, name, designation, department, dob, gender, phone, email, address,
           joining_date, salary, status, qualification, photo_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        empId,
        data.name,
        data.designation || null,
        data.department || null,
        data.dob || null,
        data.gender || 'Male',
        data.phone || null,
        data.email || null,
        data.address || null,
        data.joining_date || new Date().toISOString().split('T')[0],
        parseFloat(data.salary) || 0,
        data.status || 'Active',
        data.qualification || null,
        data.photo_path || null
      )

      const newEmp = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid)
      return { success: true, data: newEmp }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('employees:update', (_, id, data) => {
    try {
      const fields = []
      const values = []

      const allowedFields = [
        'name', 'designation', 'department', 'dob', 'gender', 'phone', 'email',
        'address', 'joining_date', 'salary', 'status', 'qualification', 'photo_path', 'emp_id'
      ]

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`)
          values.push(data[field])
        }
      })

      if (fields.length === 0) return { success: false, error: 'No fields to update' }

      values.push(id)
      db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).run(...values)

      const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('employees:delete', (_, id) => {
    try {
      db.prepare('DELETE FROM employees WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('employees:importFromExcel', (_, filePath, columnMap) => {
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      let imported = 0
      let skipped = 0
      const errors = []

      const year = new Date().getFullYear()
      let nextNum = 1
      const lastEmp = db.prepare(
        "SELECT emp_id FROM employees ORDER BY id DESC LIMIT 1"
      ).get()
      if (lastEmp) {
        const match = lastEmp.emp_id.match(/\d+$/)
        if (match) nextNum = parseInt(match[0]) + 1
      }

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO employees
          (emp_id, name, designation, department, dob, gender, phone, email, address,
           joining_date, salary, status, qualification)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

            const empId = mapped.emp_id || `EMP${year}${String(nextNum).padStart(3, '0')}`
            nextNum++

            const result = insertStmt.run(
              empId,
              mapped.name,
              mapped.designation || null,
              mapped.department || null,
              mapped.dob || null,
              mapped.gender || 'Male',
              mapped.phone || null,
              mapped.email || null,
              mapped.address || null,
              mapped.joining_date || new Date().toISOString().split('T')[0],
              parseFloat(mapped.salary) || 0,
              mapped.status || 'Active',
              mapped.qualification || null
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
