import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Save, ChevronDown, Calendar } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'Present', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { value: 'Absent', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  { value: 'Late', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' }
]

export default function Attendance() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (window.api?.classes) {
      window.api.classes.getAll({}).then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setClasses(res.data)
          setSelectedClass(String(res.data[0].id))
        }
      }).catch(err => console.error('Failed to load classes:', err))
    }
  }, [])

  useEffect(() => {
    if (selectedClass && selectedDate) loadAttendance()
  }, [selectedClass, selectedDate])

  const loadAttendance = async () => {
    setLoading(true)
    setSaved(false)
    try {
      if (!window.api?.attendance) return
      const res = await window.api.attendance.getByClass(parseInt(selectedClass), selectedDate)
      if (res.success && res.data) {
        setStudents(res.data)
        const map = {}
        res.data.forEach(s => { map[s.student_id] = s.status })
        setAttendance(map)
      }
    } finally { setLoading(false) }
  }

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  const markAll = (status) => {
    const map = {}
    students.forEach(s => { map[s.student_id] = status })
    setAttendance(map)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!selectedClass || !selectedDate || students.length === 0) return
    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: attendance[s.student_id] || 'Present'
      }))
      const res = await window.api.attendance.markBulk(parseInt(selectedClass), selectedDate, records)
      if (res.success) {
        setSaved(true)
        setNotification({ msg: `Attendance saved for ${res.count} students`, type: 'success' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ msg: res.error, type: 'error' })
        setTimeout(() => setNotification(null), 3000)
      }
    } finally { setSaving(false) }
  }

  const presentCount = students.filter(s => attendance[s.student_id] === 'Present').length
  const absentCount = students.filter(s => attendance[s.student_id] === 'Absent').length
  const lateCount = students.filter(s => attendance[s.student_id] === 'Late').length
  const total = students.length

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fadeIn
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <div className="page-header">
        <h2 className="page-title">Attendance</h2>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="btn-primary"
        >
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Attendance'}
        </button>
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Class</label>
            <select className="select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Select class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          {students.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => markAll('Present')} className="btn-success text-xs px-3 py-2">
                <CheckCircle size={13} /> All Present
              </button>
              <button onClick={() => markAll('Absent')} className="btn-danger text-xs px-3 py-2">
                <XCircle size={13} /> All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: total, color: 'bg-gray-100 text-gray-800' },
            { label: 'Present', value: presentCount, color: 'bg-green-100 text-green-800' },
            { label: 'Absent', value: absentCount, color: 'bg-red-100 text-red-800' },
            { label: 'Late', value: lateCount, color: 'bg-amber-100 text-amber-800' }
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
              <p className="text-sm font-medium opacity-75">{item.label}</p>
              <p className="text-3xl font-bold mt-1">{item.value}</p>
              {item.label !== 'Total' && total > 0 && (
                <p className="text-xs opacity-60 mt-1">{Math.round((item.value / total) * 100)}%</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Student attendance table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !selectedClass ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>Select a class to mark attendance</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No active students in this class</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th className="text-center">Present</th>
                  <th className="text-center">Absent</th>
                  <th className="text-center">Late</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const currentStatus = attendance[student.student_id] || 'Present'
                  return (
                    <tr key={student.student_id} className={
                      currentStatus === 'Absent' ? 'bg-red-50/40' :
                      currentStatus === 'Late' ? 'bg-amber-50/40' : ''
                    }>
                      <td className="text-gray-400 text-xs w-10">{idx + 1}</td>
                      <td>
                        <p className="font-medium text-gray-900">{student.name}</p>
                      </td>
                      <td className="font-mono text-xs text-gray-500">{student.admission_no}</td>
                      {STATUS_OPTIONS.map(opt => (
                        <td key={opt.value} className="text-center">
                          <label className="cursor-pointer flex items-center justify-center">
                            <input
                              type="radio"
                              name={`att-${student.student_id}`}
                              value={opt.value}
                              checked={currentStatus === opt.value}
                              onChange={() => setStatus(student.student_id, opt.value)}
                              className="sr-only"
                            />
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              currentStatus === opt.value
                                ? opt.bg + ' ' + opt.color + ' border-opacity-100'
                                : 'border-gray-200 text-gray-300 hover:border-gray-300'
                            }`}>
                              <opt.icon size={16} />
                            </div>
                          </label>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save button at bottom too */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}
