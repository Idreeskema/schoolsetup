import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Edit2, Trash2, Upload, ChevronLeft, ChevronRight, X, Briefcase } from 'lucide-react'
import ExcelImporter from '../components/ExcelImporter'

const COLORS = ['#1e3a5f','#f97316','#8b5cf6','#22c55e','#ef4444','#f59e0b']
const GENDERS = ['Male', 'Female', 'Other']
const STATUSES = ['Active', 'Inactive', 'On Leave', 'Resigned']
const DEPARTMENTS = ['Administration', 'Mathematics', 'Science', 'English', 'Social Studies', 'Arts', 'Sports', 'Library', 'Computer', 'Other']
const PAGE_SIZE = 15

function EmployeeForm({ employee, onSave, onClose, loading }) {
  const [form, setForm] = useState(employee || {
    name: '', designation: '', department: '', dob: '', gender: 'Male',
    phone: '', email: '', address: '', joining_date: new Date().toISOString().split('T')[0],
    salary: '', status: 'Active', qualification: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <div className="panel-header">
        <h3 className="font-semibold text-gray-900">{employee ? 'Edit Employee' : 'Add New Employee'}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
      </div>
      <div className="panel-body space-y-4">
        <div className="form-group">
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter full name" />
        </div>
        <div className="form-row">
          <div>
            <label className="label">Designation</label>
            <input className="input" value={form.designation || ''} onChange={e => set('designation', e.target.value)} placeholder="e.g. Teacher" />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="select" value={form.department || ''} onChange={e => set('department', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
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
            <label className="label">Phone</label>
            <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="Email address" />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Address</label>
          <textarea className="input resize-none h-16" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Enter address" />
        </div>
        <div className="form-row">
          <div>
            <label className="label">Joining Date</label>
            <input className="input" type="date" value={form.joining_date || ''} onChange={e => set('joining_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Salary ($)</label>
            <input className="input" type="number" value={form.salary || ''} onChange={e => set('salary', e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label className="label">Qualification</label>
            <input className="input" value={form.qualification || ''} onChange={e => set('qualification', e.target.value)} placeholder="e.g. M.Sc" />
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
        <button disabled={!form.name || loading} onClick={() => onSave(form)} className="btn-primary">
          {loading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
        </button>
      </div>
    </>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showImporter, setShowImporter] = useState(false)
  const [notification, setNotification] = useState(null)

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (!window.api?.employees) return
      const res = await window.api.employees.getAll({
        search, department: filterDept || undefined,
        status: filterStatus || undefined,
        limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE
      })
      if (res.success && res.data) { setEmployees(res.data); setTotal(res.total) }
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }, [search, filterDept, filterStatus, page])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const res = editEmployee
        ? await window.api.employees.update(editEmployee.id, formData)
        : await window.api.employees.create(formData)
      if (res.success) {
        showNotif(editEmployee ? 'Employee updated' : 'Employee added')
        setPanelOpen(false); setEditEmployee(null); loadData()
      } else showNotif(res.error, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    const res = await window.api.employees.delete(deleteId)
    if (res.success) { showNotif('Employee deleted'); setDeleteId(null); loadData() }
    else showNotif(res.error, 'error')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fadeIn
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="text-sm text-gray-500 mt-1">{total} total employees</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImporter(true)} className="btn-secondary">
            <Upload size={15} /> Import Excel
          </button>
          <button onClick={() => { setEditEmployee(null); setPanelOpen(true) }} className="btn-primary">
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="search-bar flex-1 min-w-48">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search name, ID, phone..." />
          </div>
          <select className="select w-44" value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1) }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="select w-36" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {(search || filterDept || filterStatus) && (
            <button className="btn-ghost text-xs" onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); setPage(1) }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Emp ID</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No employees found</td></tr>
              ) : employees.map((e, idx) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="avatar" style={{ background: COLORS[idx % COLORS.length] }}>
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-500">{e.email || e.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-gray-600">{e.emp_id}</td>
                  <td>{e.designation || '—'}</td>
                  <td>
                    {e.department && (
                      <span className="badge badge-primary">{e.department}</span>
                    )}
                  </td>
                  <td className="text-gray-500">{e.phone || '—'}</td>
                  <td className="font-medium">{e.salary ? `$${parseFloat(e.salary).toLocaleString()}` : '—'}</td>
                  <td>
                    <span className={`badge ${
                      e.status === 'Active' ? 'badge-success' :
                      e.status === 'On Leave' ? 'badge-warning' :
                      'badge-danger'
                    }`}>{e.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditEmployee(e); setPanelOpen(true) }}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(e.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 hover:bg-white rounded border disabled:opacity-40">
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
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 hover:bg-white rounded border disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {panelOpen && (
        <>
          <div className="overlay" onClick={() => { setPanelOpen(false); setEditEmployee(null) }} />
          <div className="panel animate-slideIn">
            <EmployeeForm employee={editEmployee} onSave={handleSave}
              onClose={() => { setPanelOpen(false); setEditEmployee(null) }} loading={saving} />
          </div>
        </>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-center mb-2">Delete Employee</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This will permanently delete the employee record.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showImporter && (
        <ExcelImporter entityType="employees"
          onSuccess={() => { setShowImporter(false); loadData() }}
          onClose={() => setShowImporter(false)} />
      )}
    </div>
  )
}
