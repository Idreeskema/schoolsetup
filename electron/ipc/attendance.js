export function register(ipcMain, db) {
  ipcMain.handle('attendance:markBulk', (_, classId, date, records) => {
    try {
      const markTx = db.transaction((records) => {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO attendance (student_id, class_id, date, status)
          VALUES (?, ?, ?, ?)
        `)
        records.forEach(rec => {
          stmt.run(rec.student_id, classId, date, rec.status)
        })
      })

      markTx(records)
      return { success: true, count: records.length }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('attendance:getByClass', (_, classId, date) => {
    try {
      const query = `
        SELECT s.id as student_id, s.name, s.admission_no,
          COALESCE(a.status, 'Present') as status,
          a.id as attendance_id
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
        WHERE s.class_id = ? AND s.status = 'Active'
        ORDER BY s.name
      `
      const rows = db.prepare(query).all(date, classId)
      return { success: true, data: rows }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('attendance:getReport', (_, studentId, month, year) => {
    try {
      const paddedMonth = String(month).padStart(2, '0')
      const datePrefix = `${year}-${paddedMonth}-%`

      const records = db.prepare(`
        SELECT date, status FROM attendance
        WHERE student_id = ? AND date LIKE ?
        ORDER BY date
      `).all(studentId, datePrefix)

      const total = records.length
      const present = records.filter(r => r.status === 'Present').length
      const absent = records.filter(r => r.status === 'Absent').length
      const late = records.filter(r => r.status === 'Late').length
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        success: true,
        data: { records, stats: { total, present, absent, late, percentage } }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('attendance:getMonthlyStats', (_, month, year) => {
    try {
      const paddedMonth = String(month).padStart(2, '0')
      const datePrefix = `${year}-${paddedMonth}-%`

      // Get daily attendance stats for the month
      const dailyStats = db.prepare(`
        SELECT
          date,
          COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
          COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent,
          COUNT(CASE WHEN status = 'Late' THEN 1 END) as late,
          COUNT(*) as total
        FROM attendance
        WHERE date LIKE ?
        GROUP BY date
        ORDER BY date
      `).all(datePrefix)

      // Class-wise stats
      const classStats = db.prepare(`
        SELECT
          c.name as class_name,
          COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
          COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
          COUNT(*) as total
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        WHERE a.date LIKE ?
        GROUP BY a.class_id
        ORDER BY c.name
      `).all(datePrefix)

      return { success: true, data: { dailyStats, classStats } }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

module.exports = { register }
