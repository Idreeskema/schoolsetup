export function register(ipcMain, db) {
  ipcMain.handle('classes:getAll', (_, filters = {}) => {
    try {
      let query = `
        SELECT c.*,
          e.name as teacher_name,
          COUNT(s.id) as student_count
        FROM classes c
        LEFT JOIN employees e ON c.class_teacher_id = e.id
        LEFT JOIN students s ON s.class_id = c.id AND s.status = 'Active'
        WHERE 1=1
      `
      const params = []

      if (filters.search) {
        query += ' AND (c.name LIKE ? OR c.section LIKE ?)'
        const term = `%${filters.search}%`
        params.push(term, term)
      }

      query += ' GROUP BY c.id ORDER BY c.name, c.section'

      const rows = db.prepare(query).all(...params)
      return { success: true, data: rows }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('classes:create', (_, data) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO classes (name, section, class_teacher_id, capacity)
        VALUES (?, ?, ?, ?)
      `)

      const result = stmt.run(
        data.name,
        data.section || 'A',
        data.class_teacher_id || null,
        data.capacity || 40
      )

      const newClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid)
      return { success: true, data: newClass }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('classes:update', (_, id, data) => {
    try {
      const fields = []
      const values = []

      const allowedFields = ['name', 'section', 'class_teacher_id', 'capacity']
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`)
          values.push(data[field])
        }
      })

      if (fields.length === 0) return { success: false, error: 'No fields to update' }

      values.push(id)
      db.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`).run(...values)

      const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(id)
      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('classes:delete', (_, id) => {
    try {
      // Check if students are assigned
      const studCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ?').get(id)
      if (studCount.count > 0) {
        return { success: false, error: `Cannot delete: ${studCount.count} students are assigned to this class` }
      }

      db.prepare('DELETE FROM classes WHERE id = ?').run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

module.exports = { register }
