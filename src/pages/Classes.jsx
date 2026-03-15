import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, GraduationCap, X, Search } from 'lucide-react'

const COLORS = ['#1e3a5f','#f97316','#8b5cf6','#22c55e','#ef4444','#f59e0b','#06b6d4','#ec4899']

function ClassForm({ cls, teachers, onSave, onClose, loading }) {
  const [form, setForm] = useState(cls ? {
    name: cls.name, section: cls.section,
    class_teacher_id: cls.class_teacher_id || '',
    capacity: cls.capacity
  } : { name: '', section: 'A', class_teacher_id: '', capacity: 40 })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{cls ? 'Edit Class' : 'Add New Class'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Class Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Grade 5, Class 10A" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Section</label>
              <input className="input" value={form.section} onChange={e => set('section', e.target.value)}
                placeholder="A, B, C..." />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input className="input" type="number" min="1" value={form.capacity}
                onChange={e => set('capacity', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Class Teacher</label>
            <select className="select" value={form.class_teacher_id || ''} onChange={e => set('class_teacher_id', e.target.value)}>
              <option value="">Select teacher (optional)</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} - {t.designation}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button disabled={!form.name || loading} onClick={() => onSave(form)} className="btn-primary">
            {loading ? 'Saving...' : cls ? 'Update Class' : 'Add Class'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClass, setEditClass] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [notification, setNotification] = useState(null)

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (!window.api?.classes || !window.api?.employees) return
      const [classRes, empRes] = await Promise.all([
        window.api.classes.getAll({ search }),
        window.api.employees.getAll({ status: 'Active', limit: 100 })
      ])
      if (classRes.success && classRes.data) setClasses(classRes.data)
      if (empRes.success && empRes.data) setTeachers(empRes.data)
    } catch (err) {
      console.error('Failed to load class/teacher data:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [search])

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const res = editClass
        ? await window.api.classes.update(editClass.id, formData)
        : await window.api.classes.create(formData)
      if (res.success) {
        showNotif(editClass ? 'Class updated' : 'Class added')
        setShowForm(false); setEditClass(null); loadData()
      } else showNotif(res.error, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    const res = await window.api.classes.delete(deleteId)
    if (res.success) {
      showNotif('Class deleted')
      setDeleteId(null); loadData()
    } else {
      setDeleteError(res.error)
    }
  }

  const totalStudents = classes.reduce((s, c) => s + (c.student_count || 0), 0)

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
          <h2 className="page-title">Classes</h2>
          <p className="text-sm text-gray-500 mt-1">{classes.length} classes, {totalStudents} students total</p>
        </div>
        <button onClick={() => { setEditClass(null); setShowForm(true) }} className="btn-primary">
          <Plus size={15} /> Add Class
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="search-bar max-w-sm">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..." />
        </div>
      </div>

      {/* Classes grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p>No classes found. Add your first class!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((cls, idx) => {
            const color = COLORS[idx % COLORS.length]
            const occupancy = cls.capacity > 0 ? Math.round((cls.student_count / cls.capacity) * 100) : 0
            return (
              <div key={cls.id} className="card hover:shadow-md transition-shadow group relative">
                {/* Color accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: color }} />

                <div className="flex items-start justify-between mb-4 mt-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                    <GraduationCap size={24} style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditClass(cls); setShowForm(true) }}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => { setDeleteId(cls.id); setDeleteError('') }}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                <p className="text-sm text-gray-500">Section {cls.section}</p>

                {cls.teacher_name && (
                  <p className="text-xs text-gray-400 mt-1">
                    Teacher: {cls.teacher_name}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users size={14} />
                      <span>{cls.student_count} / {cls.capacity}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      occupancy > 90 ? 'text-red-500' :
                      occupancy > 70 ? 'text-amber-500' :
                      'text-green-600'
                    }`}>{occupancy}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, occupancy)}%`,
                        background: occupancy > 90 ? '#ef4444' : occupancy > 70 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <ClassForm cls={editClass} teachers={teachers} onSave={handleSave}
          onClose={() => { setShowForm(false); setEditClass(null) }} loading={saving} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 text-center mb-2">Delete Class</h3>
            {deleteError ? (
              <p className="text-sm text-red-500 text-center mb-4">{deleteError}</p>
            ) : (
              <p className="text-sm text-gray-500 text-center mb-4">Are you sure you want to delete this class?</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setDeleteId(null); setDeleteError('') }} className="btn-secondary flex-1">
                {deleteError ? 'Close' : 'Cancel'}
              </button>
              {!deleteError && (
                <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
