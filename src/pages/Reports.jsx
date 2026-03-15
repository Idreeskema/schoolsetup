import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts'
import { Download, FileSpreadsheet, Users, UserCheck, DollarSign, ClipboardList } from 'lucide-react'

function ReportCard({ title, description, icon: Icon, color, onExport, loading }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={22} style={{ color }} />
        </div>
        <button
          onClick={onExport}
          disabled={loading}
          className="btn-secondary text-xs"
        >
          {loading ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={13} />
          )}
          {loading ? 'Exporting...' : 'Export Excel'}
        </button>
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  )
}

export default function Reports() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState({})
  const [filters, setFilters] = useState({
    students: { class_id: '', status: '' },
    fees: { status: '', fee_type: '' },
    attendance: { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
  })
  const [feeStats, setFeeStats] = useState([])
  const [attendanceStats, setAttendanceStats] = useState([])
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (window.api?.classes) {
      window.api.classes.getAll({}).then(res => {
        if (res.success && res.data) setClasses(res.data)
      }).catch(err => console.error('Failed to load classes:', err))
    }
    loadChartData()
  }, [])

  const loadChartData = async () => {
    try {
      if (!window.api?.fees || !window.api?.attendance) return
      const now = new Date()
      const [feeRes, attRes] = await Promise.all([
        window.api.fees.getStats(),
        window.api.attendance.getMonthlyStats(now.getMonth() + 1, now.getFullYear())
      ])
      if (feeRes.success && feeRes.data) {
        setFeeStats(feeRes.data.byType || [])
      }
      if (attRes.success && attRes.data) {
        setAttendanceStats(attRes.data.classStats || [])
      }
    } catch (err) {
      console.error('Failed to load chart data:', err)
      showNotif('Failed to load chart data', 'error')
    }
  }

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const setLoadingFor = (key, val) => setLoading(p => ({ ...p, [key]: val }))

  const exportStudents = async () => {
    setLoadingFor('students', true)
    try {
      const res = await window.api.students.getAll({
        class_id: filters.students.class_id || undefined,
        status: filters.students.status || undefined,
        limit: 10000
      })
      if (!res.success) return showNotif(res.error, 'error')

      const pathRes = await window.api.dialog.saveFile({
        defaultPath: 'students_report.xlsx',
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      })
      if (!pathRes.data) return

      const data = res.data.map(s => ({
        'Admission No': s.admission_no,
        'Name': s.name,
        "Father's Name": s.father_name || '',
        "Mother's Name": s.mother_name || '',
        'DOB': s.dob || '',
        'Gender': s.gender || '',
        'Class': s.class_name || '',
        'Section': s.section || '',
        'Phone': s.phone || '',
        'Email': s.email || '',
        'Address': s.address || '',
        'Admission Date': s.admission_date || '',
        'Status': s.status
      }))

      const exportRes = await window.api.reports.exportToExcel({
        data, sheetName: 'Students', filePath: pathRes.data
      })
      if (exportRes.success) showNotif('Students report exported successfully')
      else showNotif(exportRes.error, 'error')
    } finally { setLoadingFor('students', false) }
  }

  const exportEmployees = async () => {
    setLoadingFor('employees', true)
    try {
      const res = await window.api.employees.getAll({ limit: 10000 })
      if (!res.success) return showNotif(res.error, 'error')

      const pathRes = await window.api.dialog.saveFile({ defaultPath: 'employees_report.xlsx' })
      if (!pathRes.data) return

      const data = res.data.map(e => ({
        'Emp ID': e.emp_id,
        'Name': e.name,
        'Designation': e.designation || '',
        'Department': e.department || '',
        'DOB': e.dob || '',
        'Gender': e.gender || '',
        'Phone': e.phone || '',
        'Email': e.email || '',
        'Joining Date': e.joining_date || '',
        'Salary': e.salary || '',
        'Qualification': e.qualification || '',
        'Status': e.status
      }))

      const exportRes = await window.api.reports.exportToExcel({
        data, sheetName: 'Employees', filePath: pathRes.data
      })
      if (exportRes.success) showNotif('Employees report exported successfully')
      else showNotif(exportRes.error, 'error')
    } finally { setLoadingFor('employees', false) }
  }

  const exportFees = async () => {
    setLoadingFor('fees', true)
    try {
      const res = await window.api.fees.getAll({
        status: filters.fees.status || undefined,
        fee_type: filters.fees.fee_type || undefined,
        limit: 10000
      })
      if (!res.success) return showNotif(res.error, 'error')

      const pathRes = await window.api.dialog.saveFile({ defaultPath: 'fees_report.xlsx' })
      if (!pathRes.data) return

      const data = res.data.map(f => ({
        'Receipt No': f.receipt_no || '',
        'Student Name': f.student_name,
        'Admission No': f.admission_no,
        'Fee Type': f.fee_type,
        'Amount': f.amount,
        'Due Date': f.due_date || '',
        'Paid Date': f.paid_date || '',
        'Status': f.status
      }))

      const exportRes = await window.api.reports.exportToExcel({
        data, sheetName: 'Fees', filePath: pathRes.data
      })
      if (exportRes.success) showNotif('Fees report exported successfully')
      else showNotif(exportRes.error, 'error')
    } finally { setLoadingFor('fees', false) }
  }

  const exportAttendance = async () => {
    setLoadingFor('attendance', true)
    try {
      const { month, year } = filters.attendance
      const res = await window.api.attendance.getMonthlyStats(month, year)
      if (!res.success) return showNotif(res.error, 'error')

      const pathRes = await window.api.dialog.saveFile({ defaultPath: `attendance_${year}_${month}.xlsx` })
      if (!pathRes.data) return

      const data = (res.data.dailyStats || []).map(d => ({
        'Date': d.date,
        'Total': d.total,
        'Present': d.present,
        'Absent': d.absent,
        'Late': d.late,
        'Attendance %': d.total > 0 ? Math.round((d.present / d.total) * 100) + '%' : '0%'
      }))

      if (data.length === 0) return showNotif('No attendance data for this period', 'error')

      const exportRes = await window.api.reports.exportToExcel({
        data, sheetName: 'Attendance', filePath: pathRes.data
      })
      if (exportRes.success) showNotif('Attendance report exported successfully')
      else showNotif(exportRes.error, 'error')
    } finally { setLoadingFor('attendance', false) }
  }

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fadeIn
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <div className="page-header">
        <h2 className="page-title">Reports</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileSpreadsheet size={16} />
          Export data to Excel
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Students report */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users size={22} className="text-[#1e3a5f]" />
            </div>
            <button onClick={exportStudents} disabled={loading.students} className="btn-secondary text-xs">
              {loading.students ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              {loading.students ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
          <h3 className="font-semibold text-gray-900">Student List</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Export complete student directory</p>
          <div className="flex gap-3">
            <select className="select text-xs flex-1" value={filters.students.class_id}
              onChange={e => setFilters(p => ({ ...p, students: { ...p.students, class_id: e.target.value } }))}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
            <select className="select text-xs flex-1" value={filters.students.status}
              onChange={e => setFilters(p => ({ ...p, students: { ...p.students, status: e.target.value } }))}>
              <option value="">All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Employees report */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
              <UserCheck size={22} className="text-orange-600" />
            </div>
            <button onClick={exportEmployees} disabled={loading.employees} className="btn-secondary text-xs">
              {loading.employees ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              {loading.employees ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
          <h3 className="font-semibold text-gray-900">Employee List</h3>
          <p className="text-sm text-gray-500 mt-1">Export complete employee directory with details</p>
        </div>

        {/* Fees report */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign size={22} className="text-green-700" />
            </div>
            <button onClick={exportFees} disabled={loading.fees} className="btn-secondary text-xs">
              {loading.fees ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              {loading.fees ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
          <h3 className="font-semibold text-gray-900">Fee Collection</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Export fee records and payment history</p>
          <div className="flex gap-3">
            <select className="select text-xs flex-1" value={filters.fees.status}
              onChange={e => setFilters(p => ({ ...p, fees: { ...p.fees, status: e.target.value } }))}>
              <option value="">All Status</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        {/* Attendance report */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
              <ClipboardList size={22} className="text-purple-600" />
            </div>
            <button onClick={exportAttendance} disabled={loading.attendance} className="btn-secondary text-xs">
              {loading.attendance ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
              {loading.attendance ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
          <h3 className="font-semibold text-gray-900">Attendance Summary</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Export monthly attendance statistics</p>
          <div className="flex gap-3">
            <select className="select text-xs flex-1" value={filters.attendance.month}
              onChange={e => setFilters(p => ({ ...p, attendance: { ...p.attendance, month: e.target.value } }))}>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select className="select text-xs w-24" value={filters.attendance.year}
              onChange={e => setFilters(p => ({ ...p, attendance: { ...p.attendance, year: e.target.value } }))}>
              {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Fee by type */}
        {feeStats.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Fee Collection by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feeStats} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="fee_type" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => `$${parseFloat(v).toFixed(2)}`}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Attendance by class */}
        {attendanceStats.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Attendance by Class</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceStats} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="class_name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="present" fill="#1e3a5f" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
