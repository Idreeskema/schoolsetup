export function register(ipcMain, db) {
  ipcMain.handle('fees:getAll', (_, filters = {}) => {
    try {
      let query = `
        SELECT f.*,
          s.name as student_name,
          s.admission_no,
          c.name as class_name
        FROM fees f
        JOIN students s ON f.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE 1=1
      `
      const params = []

      if (filters.student_id) {
        query += ' AND f.student_id = ?'
        params.push(filters.student_id)
      }
      if (filters.status) {
        query += ' AND f.status = ?'
        params.push(filters.status)
      }
      if (filters.fee_type) {
        query += ' AND f.fee_type = ?'
        params.push(filters.fee_type)
      }
      if (filters.class_id) {
        query += ' AND s.class_id = ?'
        params.push(filters.class_id)
      }
      if (filters.search) {
        query += ' AND (s.name LIKE ? OR s.admission_no LIKE ? OR f.receipt_no LIKE ?)'
        const term = `%${filters.search}%`
        params.push(term, term, term)
      }

      query += ' ORDER BY f.created_at DESC'

      if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit) }
      if (filters.offset) { query += ' OFFSET ?'; params.push(filters.offset) }

      const rows = db.prepare(query).all(...params)

      // Count query
      let countQuery = `
        SELECT COUNT(*) as total FROM fees f
        JOIN students s ON f.student_id = s.id
        WHERE 1=1
      `
      const countParams = []
      if (filters.student_id) { countQuery += ' AND f.student_id = ?'; countParams.push(filters.student_id) }
      if (filters.status) { countQuery += ' AND f.status = ?'; countParams.push(filters.status) }
      if (filters.fee_type) { countQuery += ' AND f.fee_type = ?'; countParams.push(filters.fee_type) }
      if (filters.class_id) { countQuery += ' AND s.class_id = ?'; countParams.push(filters.class_id) }
      if (filters.search) {
        countQuery += ' AND (s.name LIKE ? OR s.admission_no LIKE ? OR f.receipt_no LIKE ?)'
        const term = `%${filters.search}%`
        countParams.push(term, term, term)
      }

      const { total } = db.prepare(countQuery).get(...countParams)
      return { success: true, data: rows, total }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('fees:create', (_, data) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO fees (student_id, fee_type, amount, due_date, status)
        VALUES (?, ?, ?, ?, 'Pending')
      `)

      const result = stmt.run(
        data.student_id,
        data.fee_type,
        parseFloat(data.amount),
        data.due_date || null
      )

      const newFee = db.prepare(`
        SELECT f.*, s.name as student_name, s.admission_no
        FROM fees f
        JOIN students s ON f.student_id = s.id
        WHERE f.id = ?
      `).get(result.lastInsertRowid)

      return { success: true, data: newFee }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('fees:markPaid', (_, id) => {
    try {
      // Generate receipt number
      const lastReceipt = db.prepare(
        "SELECT receipt_no FROM fees WHERE receipt_no IS NOT NULL ORDER BY id DESC LIMIT 1"
      ).get()

      let nextNum = 1
      if (lastReceipt && lastReceipt.receipt_no) {
        const match = lastReceipt.receipt_no.match(/\d+$/)
        if (match) nextNum = parseInt(match[0]) + 1
      }

      const receiptNo = `RCP${String(nextNum).padStart(5, '0')}`
      const today = new Date().toISOString().split('T')[0]

      db.prepare(`
        UPDATE fees
        SET status = 'Paid', paid_date = ?, receipt_no = ?
        WHERE id = ? AND status = 'Pending'
      `).run(today, receiptNo, id)

      const updated = db.prepare(`
        SELECT f.*, s.name as student_name, s.admission_no
        FROM fees f
        JOIN students s ON f.student_id = s.id
        WHERE f.id = ?
      `).get(id)

      return { success: true, data: updated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('fees:generateReceipt', (_, id) => {
    try {
      const fee = db.prepare(`
        SELECT f.*,
          s.name as student_name,
          s.admission_no,
          s.father_name,
          c.name as class_name,
          c.section
        FROM fees f
        JOIN students s ON f.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE f.id = ?
      `).get(id)

      if (!fee) return { success: false, error: 'Fee record not found' }

      const settings = {}
      db.prepare('SELECT key, value FROM settings').all().forEach(r => {
        settings[r.key] = r.value
      })

      const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Fee Receipt - ${fee.receipt_no || 'Pending'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #1e3a5f; padding: 30px; }
            .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 15px; margin-bottom: 20px; }
            .school-name { font-size: 22px; font-weight: bold; color: #1e3a5f; }
            .school-info { font-size: 12px; color: #666; margin-top: 4px; }
            .receipt-title { font-size: 16px; font-weight: bold; margin: 10px 0; color: #f97316; text-transform: uppercase; letter-spacing: 2px; }
            .receipt-no { font-size: 14px; color: #666; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .info-item { padding: 8px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-size: 11px; color: #666; text-transform: uppercase; }
            .info-value { font-size: 14px; font-weight: 600; margin-top: 2px; }
            .amount-box { background: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
            .amount-label { font-size: 12px; opacity: 0.8; }
            .amount-value { font-size: 32px; font-weight: bold; margin-top: 4px; }
            .footer { text-align: center; font-size: 11px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="school-name">${settings.school_name || 'School Name'}</div>
              <div class="school-info">${settings.school_address || ''}</div>
              <div class="school-info">${settings.school_phone || ''} | ${settings.school_email || ''}</div>
              <div class="receipt-title">Fee Receipt</div>
              <div class="receipt-no">Receipt No: ${fee.receipt_no || 'N/A'}</div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Student Name</div>
                <div class="info-value">${fee.student_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Admission No</div>
                <div class="info-value">${fee.admission_no}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Class</div>
                <div class="info-value">${fee.class_name || 'N/A'} - ${fee.section || ''}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Father's Name</div>
                <div class="info-value">${fee.father_name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Fee Type</div>
                <div class="info-value">${fee.fee_type}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Due Date</div>
                <div class="info-value">${fee.due_date || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Date</div>
                <div class="info-value">${fee.paid_date || 'Not Paid'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge ${fee.status === 'Paid' ? 'status-paid' : 'status-pending'}">
                    ${fee.status}
                  </span>
                </div>
              </div>
            </div>

            <div class="amount-box">
              <div class="amount-label">Amount</div>
              <div class="amount-value">$${parseFloat(fee.amount).toFixed(2)}</div>
            </div>

            <div class="footer">
              <p>This is a computer-generated receipt and does not require a signature.</p>
              <p>Academic Year: ${settings.academic_year || '2024-2025'}</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `

      return { success: true, data: receiptHtml, fee }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('fees:getStats', () => {
    try {
      const stats = db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as total_collected,
          SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending,
          SUM(CASE WHEN status = 'Pending' AND due_date < date('now') THEN amount ELSE 0 END) as total_overdue,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count
        FROM fees
      `).get()

      // Monthly collection for charts
      const monthlyCollection = db.prepare(`
        SELECT
          strftime('%Y-%m', paid_date) as month,
          SUM(amount) as amount
        FROM fees
        WHERE status = 'Paid' AND paid_date IS NOT NULL
        GROUP BY strftime('%Y-%m', paid_date)
        ORDER BY month DESC
        LIMIT 12
      `).all()

      // By fee type
      const byType = db.prepare(`
        SELECT
          fee_type,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as collected,
          SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pending
        FROM fees
        GROUP BY fee_type
      `).all()

      return { success: true, data: { ...stats, monthlyCollection, byType } }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('fees:getFeeTypes', () => {
    try {
      const types = db.prepare(
        'SELECT DISTINCT fee_type FROM fees ORDER BY fee_type'
      ).all().map(r => r.fee_type)

      const defaultTypes = ['Tuition', 'Activity', 'Library', 'Transport', 'Exam', 'Sports', 'Hostel']
      const allTypes = [...new Set([...defaultTypes, ...types])]

      return { success: true, data: allTypes }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

module.exports = { register }
