import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Edit2, Trash2, Upload, ChevronLeft, ChevronRight,
  X, User, Filter, Eye
} from 'lucide-react'
import ExcelImporter from '../components/ExcelImporter'

const COLORS = ['#1e3a5f','#f97316','#8b5cf6','#22c55e','#ef4444','#f59e0b','#06b6d4']

const GENDERS = ['Male', 'Female', 'Other']
const STATUSES = ['Active', 'Inactive', 'Transferred', 'Graduated']

function StudentForm({ student, classes, onSave, onClose, loading }) {
  const [form, setForm] = useState(student || {
    name: '', father_name: '', mother_name: '', dob: '', gender: 'Male',
    class_id: '', section: 'A', address: '', phone: '', email: '',
    admission_date: new Date().toISOString().split('T')[0], status: 'Active'
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <div className="panel-header">
        <h3 className="font-semibold text-gray-900">{student ? 'Edit Student' : 'Add New Student'}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
      </div>
      <div className="panel-body space-y-4">
        <div className="form-group">
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter full name" />
        </div>
        <div className="form-row">
          <div>
            <label className="label">Father's Name</label>
            <input className="input" value={form.father_name || ''} onChange={e => set('father_name', e.target.value)} placeholder="Father's name" />
          </div>
          <div>
            <label className="label">Mother's Name</label>
            <input className="input" value={form.mother_name || ''} onChange={e => set('mother_name', e.target.value)} placeholder="Mother's name" />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label className="label">Date of Birth</label>
            <input className="input" type="date" value={form.dob || ''} onChange={e => set('dob', e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="select" value={form.gender || 'Male'} onChange={e => set('gender', e.target.value)}>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label className="label">Class</label>
            <select className="select" value={form.class_id || ''} onChange={e => set('class_id', e.target.value)}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <input className="input" value={form.section || 'A'} onChange={e => set('section', e.target.value)} placeholder="A" />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Phone</label>
          <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div className="form-group">
          <label className="label">Address</label>
          <textarea className="input resize-none h-16" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Enter address" />
        </div>
        <div className="form-row">
          <div>
            <label className="label">Admission Date</label>
            <input className="input" type="date" value={form.admission_date || ''} onChange={e => set('admission_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status || 'Active'} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button
          disabled={!form.name || loading}
          onClick={() => onSave(form)}
          className="btn-primary"
        >
          {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </>
  )
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showImporter, setShowImporter] = useState(false)
  const [notification, setNotification] = useState(null)

  const PAGE_SIZE = 15

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (!window.api?.students || !window.api?.classes) return
      const [studRes, classRes] = await Promise.all([
        window.api.students.getAll({
          search, class_id: filterClass || undefined,
          status: filterStatus || undefined,
          limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE
        }),
        window.api.classes.getAll({})
      ])
      if (studRes.success && studRes.data) { setStudents(studRes.data); setTotal(studRes.total) }
      if (classRes.success && classRes.data) setClasses(classRes.data)
    } catch (err) {
      console.error('Failed to load student/class data:', err)
    } finally {
      setLoading(false)
    }
  }, [search, filterClass, filterStatus, page])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const res = editStudent
        ? await window.api.students.update(editStudent.id, formData)
        : await window.api.students.create(formData)
      if (res.success) {
        showNotif(editStudent ? 'Student updated successfully' : 'Student added successfully')
        setPanelOpen(false)
        setEditStudent(null)
        loadData()
      } else {
        showNotif(res.error, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const res = await window.api.students.delete(deleteId)
    if (res.success) {
      showNotif('Student deleted')
      setDeleteId(null)
      loadData()
    } else {
      showNotif(res.error, 'error')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fadeIn
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="text-sm text-gray-500 mt-1">{total} total students</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImporter(true)} className="btn-secondary">
            <Upload size={15} />
            Import Excel
          </button>
          <button onClick={() => { setEditStudent(null); setPanelOpen(true) }} className="btn-primary">
            <Plus size={15} />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="search-bar flex-1 min-w-48">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, admission no, phone..."
            />
          </div>
          <select className="select w-44" value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1) }}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
          <select className="select w-36" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {(search || filterClass || filterStatus) && (
            <button className="btn-ghost text-xs" onClick={() => { setSearch(''); setFilterClass(''); setFilterStatus(''); setPage(1) }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Admission Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">
                  No students found
                </td></tr>
              ) : students.map((s, idx) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="avatar" style={{ background: COLORS[idx % COLORS.length] }}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email || s.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-gray-600">{s.admission_no}</td>
                  <td>{s.class_name ? `${s.class_name} - ${s.section}` : '—'}</td>
                  <td className="text-gray-500">{s.phone || '—'}</td>
                  <td className="text-gray-500 text-xs">{s.admission_date}</td>
                  <td>
                    <span className={`badge ${
                      s.status === 'Active' ? 'badge-success' :
                      s.status === 'Inactive' ? 'badge-danger' :
                      'badge-gray'
                    }`}>{s.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditStudent(s); setPanelOpen(true) }}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 hover:bg-white rounded border disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs rounded border ${p === page ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'hover:bg-white'}`}>
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 hover:bg-white rounded border disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side panel */}
      {panelOpen && (
        <>
          <div className="overlay" onClick={() => { setPanelOpen(false); setEditStudent(null) }} />
          <div className="panel animate-slideIn">
            <StudentForm
              student={editStudent}
              classes={classes}
              onSave={handleSave}
              onClose={() => { setPanelOpen(false); setEditStudent(null) }}
              loading={saving}
            />
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-center mb-2">Delete Student</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This will permanently delete the student and all related records.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel importer */}
      {showImporter && (
        <ExcelImporter
          entityType="students"
          onSuccess={() => { setShowImporter(false); loadData() }}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  )
}
