import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, DollarSign, CheckCircle, X, ChevronLeft, ChevronRight,
  Printer, Eye, Filter
} from 'lucide-react'

const PAGE_SIZE = 15

function AddFeeModal({ students, feeTypes, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    student_id: '', fee_type: '', amount: '', due_date: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add Fee Record</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Student *</label>
            <select className="select" value={form.student_id} onChange={e => set('student_id', e.target.value)}>
              <option value="">Select student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.admission_no}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fee Type *</label>
            <select className="select" value={form.fee_type} onChange={e => set('fee_type', e.target.value)}>
              <option value="">Select type...</option>
              {feeTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount ($) *</label>
            <input className="input" type="number" min="0" step="0.01" value={form.amount}
              onChange={e => set('amount', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={!form.student_id || !form.fee_type || !form.amount || loading}
            onClick={() => onSave(form)}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Add Fee'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReceiptModal({ receipt, fee, onClose }) {
  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(receipt)
    w.document.close()
    w.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Fee Receipt</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-primary text-xs">
              <Printer size={13} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <iframe
            srcDoc={receipt}
            className="w-full h-96 border-0 rounded-xl bg-white"
            title="Receipt Preview"
          />
        </div>
      </div>
    </div>
  )
}

export default function Fees() {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [notification, setNotification] = useState(null)

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (!window.api?.fees) return
      const [feesRes, statsRes] = await Promise.all([
        window.api.fees.getAll({
          search, status: filterStatus || undefined,
          fee_type: filterType || undefined,
          limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE
        }),
        window.api.fees.getStats()
      ])
      if (feesRes.success && feesRes.data) { setFees(feesRes.data); setTotal(feesRes.total) }
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to load fee data:', err)
    } finally { setLoading(false) }
  }, [search, filterStatus, filterType, page])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (window.api?.students) {
      window.api.students.getAll({ status: 'Active', limit: 500 }).then(res => {
        if (res.success && res.data) setStudents(res.data)
      }).catch(err => console.error('Failed to load students:', err))
    }
    if (window.api?.fees) {
      window.api.fees.getFeeTypes().then(res => {
        if (res.success && res.data) setFeeTypes(res.data)
      }).catch(err => console.error('Failed to load fee types:', err))
    }
  }, [])

  const handleAddFee = async (formData) => {
    setSaving(true)
    try {
      const res = await window.api.fees.create(formData)
      if (res.success) {
        showNotif('Fee record added')
        setShowAddModal(false); loadData()
      } else showNotif(res.error, 'error')
    } finally { setSaving(false) }
  }

  const handleMarkPaid = async (id) => {
    const res = await window.api.fees.markPaid(id)
    if (res.success) { showNotif('Fee marked as paid'); loadData() }
    else showNotif(res.error, 'error')
  }

  const handleViewReceipt = async (id) => {
    const res = await window.api.fees.generateReceipt(id)
    if (res.success) setReceipt({ html: res.data, fee: res.fee })
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
        <h2 className="page-title">Fees</h2>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={15} /> Add Fee Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign size={22} className="text-green-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Collected</p>
            <p className="text-xl font-bold text-green-700">
              ${parseFloat(stats.total_collected || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{stats.paid_count || 0} payments</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <DollarSign size={22} className="text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending</p>
            <p className="text-xl font-bold text-amber-700">
              ${parseFloat(stats.total_pending || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{stats.pending_count || 0} records</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <DollarSign size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Overdue</p>
            <p className="text-xl font-bold text-red-600">
              ${parseFloat(stats.total_overdue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="search-bar flex-1 min-w-48">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search student, receipt no..." />
          </div>
          <select className="select w-40" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option>Paid</option>
            <option>Pending</option>
          </select>
          <select className="select w-40" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}>
            <option value="">All Types</option>
            {feeTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          {(search || filterStatus || filterType) && (
            <button className="btn-ghost text-xs" onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setPage(1) }}>
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
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>Receipt No</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : fees.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No fee records found</td></tr>
              ) : fees.map(fee => (
                <tr key={fee.id}>
                  <td>
                    <p className="font-medium text-gray-900">{fee.student_name}</p>
                    <p className="text-xs text-gray-500">{fee.admission_no}</p>
                  </td>
                  <td><span className="badge badge-primary">{fee.fee_type}</span></td>
                  <td className="font-semibold">${parseFloat(fee.amount).toFixed(2)}</td>
                  <td className="text-xs text-gray-600">
                    {fee.due_date || '—'}
                    {fee.status === 'Pending' && fee.due_date && new Date(fee.due_date) < new Date() && (
                      <span className="block text-red-500 text-xs">Overdue</span>
                    )}
                  </td>
                  <td className="text-xs text-gray-600">{fee.paid_date || '—'}</td>
                  <td className="font-mono text-xs text-gray-500">{fee.receipt_no || '—'}</td>
                  <td>
                    <span className={`badge ${fee.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {fee.status === 'Pending' && (
                        <button onClick={() => handleMarkPaid(fee.id)}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg" title="Mark Paid">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {fee.status === 'Paid' && (
                        <button onClick={() => handleViewReceipt(fee.id)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="View Receipt">
                          <Eye size={14} />
                        </button>
                      )}
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

      {showAddModal && (
        <AddFeeModal students={students} feeTypes={feeTypes}
          onSave={handleAddFee} onClose={() => setShowAddModal(false)} loading={saving} />
      )}

      {receipt && (
        <ReceiptModal receipt={receipt.html} fee={receipt.fee}
          onClose={() => setReceipt(null)} />
      )}
    </div>
  )
}
