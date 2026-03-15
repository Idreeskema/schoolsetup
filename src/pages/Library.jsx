import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus, BookOpen, X, RefreshCw, AlertCircle, Upload, Edit2 } from 'lucide-react'
import ExcelImporter from '../components/ExcelImporter'

const CATEGORIES = ['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Art', 'Science', 'History', 'Computer', 'General']

function BookForm({ book, onSave, onClose, loading }) {
  const [form, setForm] = useState(book || {
    title: '', author: '', publisher: '', isbn: '', category: 'Textbook', total_copies: 1
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{book ? 'Edit Book' : 'Add New Book'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Book title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Author</label>
              <input className="input" value={form.author || ''} onChange={e => set('author', e.target.value)} placeholder="Author name" />
            </div>
            <div>
              <label className="label">Publisher</label>
              <input className="input" value={form.publisher || ''} onChange={e => set('publisher', e.target.value)} placeholder="Publisher" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ISBN</label>
              <input className="input" value={form.isbn || ''} onChange={e => set('isbn', e.target.value)} placeholder="ISBN" />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category || 'General'} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Total Copies</label>
            <input className="input" type="number" min="1" value={form.total_copies || 1} onChange={e => set('total_copies', e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button disabled={!form.title || loading} onClick={() => onSave(form)} className="btn-primary">
            {loading ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IssueModal({ books, students, onIssue, onClose, loading }) {
  const [bookId, setBookId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Issue Book</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Select Book *</label>
            <select className="select" value={bookId} onChange={e => setBookId(e.target.value)}>
              <option value="">Choose a book...</option>
              {books.filter(b => b.available_copies > 0).map(b => (
                <option key={b.id} value={b.id}>{b.title} (Avail: {b.available_copies})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Select Student *</label>
            <select className="select" value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">Choose a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.admission_no}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={!bookId || !studentId || !dueDate || loading}
            onClick={() => onIssue(bookId, studentId, dueDate)}
            className="btn-primary"
          >
            {loading ? 'Issuing...' : 'Issue Book'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Library() {
  const [activeTab, setActiveTab] = useState('books')
  const [books, setBooks] = useState([])
  const [issues, setIssues] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [showBookForm, setShowBookForm] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const [notification, setNotification] = useState(null)

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadBooks = useCallback(async () => {
    setLoading(true)
    try {
      if (!window.api?.library) return
      const res = await window.api.library.getBooks({
        search, category: filterCategory || undefined
      })
      if (res.success && res.data) setBooks(res.data)
      else if (!res.success) showNotif(res.error, 'error')
    } catch (err) {
      showNotif('Failed to load books', 'error')
    } finally { setLoading(false) }
  }, [search, filterCategory])

  const loadIssues = useCallback(async () => {
    setLoading(true)
    try {
      if (!window.api?.library) return
      const res = await window.api.library.getIssues({ status: filterStatus })
      if (res.success && res.data) setIssues(res.data)
      else if (!res.success) showNotif(res.error, 'error')
    } catch (err) {
      showNotif('Failed to load issues', 'error')
    } finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => {
    if (activeTab === 'books') loadBooks()
    else loadIssues()
  }, [activeTab, loadBooks, loadIssues])

  useEffect(() => {
    if (window.api?.students) {
      window.api.students.getAll({ status: 'Active', limit: 200 }).then(res => {
        if (res.success && res.data) setStudents(res.data)
      }).catch(err => console.error('Failed to load students for library:', err))
    }
  }, [])

  const handleSaveBook = async (formData) => {
    setSaving(true)
    try {
      const res = editBook
        ? await window.api.library.updateBook(editBook.id, formData)
        : await window.api.library.addBook(formData)
      if (res.success) {
        showNotif(editBook ? 'Book updated' : 'Book added')
        setShowBookForm(false); setEditBook(null); loadBooks()
      } else showNotif(res.error, 'error')
    } finally { setSaving(false) }
  }

  const handleIssue = async (bookId, studentId, dueDate) => {
    setSaving(true)
    try {
      const res = await window.api.library.issueBook(parseInt(bookId), parseInt(studentId), dueDate)
      if (res.success) {
        showNotif('Book issued successfully')
        setShowIssueModal(false); loadBooks(); loadIssues()
      } else showNotif(res.error, 'error')
    } finally { setSaving(false) }
  }

  const handleReturn = async (issueId) => {
    const res = await window.api.library.returnBook(issueId)
    if (res.success) {
      const fine = res.fine
      showNotif(fine > 0 ? `Book returned. Fine: $${fine.toFixed(2)}` : 'Book returned successfully')
      loadBooks(); loadIssues()
    } else showNotif(res.error, 'error')
  }

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fadeIn
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <div className="page-header">
        <h2 className="page-title">Library</h2>
        <div className="flex items-center gap-2">
          {activeTab === 'books' && (
            <>
              <button onClick={() => setShowImporter(true)} className="btn-secondary">
                <Upload size={15} /> Import Books
              </button>
              <button onClick={() => { setEditBook(null); setShowBookForm(true) }} className="btn-secondary">
                <Plus size={15} /> Add Book
              </button>
            </>
          )}
          <button onClick={() => setShowIssueModal(true)} className="btn-primary">
            <BookOpen size={15} /> Issue Book
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['books', 'Books'], ['issues', 'Issues']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Books tab */}
      {activeTab === 'books' && (
        <>
          <div className="card p-4">
            <div className="flex flex-wrap gap-3">
              <div className="search-bar flex-1 min-w-48">
                <Search size={14} className="text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author, ISBN..." />
              </div>
              <select className="select w-40" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Book ID</th>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : books.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No books found</td></tr>
                  ) : books.map(book => (
                    <tr key={book.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                            <BookOpen size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{book.title}</p>
                            <p className="text-xs text-gray-500">{book.author || 'Unknown author'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-gray-600">{book.book_id}</td>
                      <td><span className="badge badge-primary">{book.category}</span></td>
                      <td className="text-center">{book.total_copies}</td>
                      <td className="text-center">
                        <span className={`font-semibold ${book.available_copies > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {book.available_copies}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${book.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {book.available_copies > 0 ? 'Available' : 'All Issued'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => { setEditBook(book); setShowBookForm(true) }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Issues tab */}
      {activeTab === 'issues' && (
        <>
          <div className="card p-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {[['active', 'Active'], ['overdue', 'Overdue'], ['returned', 'Returned'], ['', 'All']].map(([val, label]) => (
                  <button key={val} onClick={() => setFilterStatus(val)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      filterStatus === val ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Student</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Fine</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : issues.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">No issues found</td></tr>
                  ) : issues.map(issue => (
                    <tr key={issue.id} className={issue.display_status === 'Overdue' ? 'bg-red-50/50' : ''}>
                      <td>
                        <p className="font-medium text-gray-900">{issue.book_title}</p>
                        <p className="text-xs text-gray-500">{issue.book_code}</p>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900">{issue.student_name}</p>
                        <p className="text-xs text-gray-500">{issue.admission_no}</p>
                      </td>
                      <td className="text-xs text-gray-600">{issue.issue_date}</td>
                      <td className={`text-xs font-medium ${issue.display_status === 'Overdue' ? 'text-red-600' : 'text-gray-600'}`}>
                        {issue.due_date}
                        {issue.days_overdue > 0 && (
                          <span className="block text-red-500">({issue.days_overdue}d overdue)</span>
                        )}
                      </td>
                      <td className="text-xs text-gray-600">{issue.return_date || '—'}</td>
                      <td className={issue.fine_amount > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                        {issue.fine_amount > 0 ? `$${parseFloat(issue.fine_amount).toFixed(2)}` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          issue.display_status === 'Overdue' ? 'badge-danger' :
                          issue.display_status === 'Issued' ? 'badge-warning' :
                          'badge-success'
                        }`}>{issue.display_status}</span>
                      </td>
                      <td>
                        {issue.status === 'Issued' && (
                          <button onClick={() => handleReturn(issue.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                            <RefreshCw size={11} /> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showBookForm && (
        <BookForm book={editBook} onSave={handleSaveBook}
          onClose={() => { setShowBookForm(false); setEditBook(null) }} loading={saving} />
      )}

      {showIssueModal && (
        <IssueModal books={books} students={students} onIssue={handleIssue}
          onClose={() => setShowIssueModal(false)} loading={saving} />
      )}

      {showImporter && (
        <ExcelImporter entityType="books"
          onSuccess={() => { setShowImporter(false); loadBooks() }}
          onClose={() => setShowImporter(false)} />
      )}
    </div>
  )
}
