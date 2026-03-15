import React, { useState, useEffect } from 'react'
import { Save, School, Phone, Mail, MapPin, Calendar, DollarSign, Check } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    academic_year: '',
    fine_per_day: '2.00',
    currency: 'USD'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      if (!window.api?.settings) return
      const res = await window.api.settings.getAll()
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally { setLoading(false) }
  }

  const set = (key, value) => {
    setSaved(false)
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        window.api.settings.set(key, value)
      )
      await Promise.all(promises)
      setSaved(true)
      setNotification({ msg: 'Settings saved successfully', type: 'success' })
      setTimeout(() => { setNotification(null); setSaved(false) }, 3000)
    } catch (err) {
      setNotification({ msg: err.message, type: 'error' })
      setTimeout(() => setNotification(null), 3000)
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-fadeIn
          ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary transition-all ${saved ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* School Information */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <School size={20} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">School Information</h3>
            <p className="text-xs text-gray-500">Basic details about your school</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">School Name *</label>
            <input
              className="input"
              value={settings.school_name || ''}
              onChange={e => set('school_name', e.target.value)}
              placeholder="Enter school name"
            />
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              className="input resize-none h-20"
              value={settings.school_address || ''}
              onChange={e => set('school_address', e.target.value)}
              placeholder="School address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5"><Phone size={12} />Phone</span>
              </label>
              <input
                className="input"
                value={settings.school_phone || ''}
                onChange={e => set('school_phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="label">
                <span className="flex items-center gap-1.5"><Mail size={12} />Email</span>
              </label>
              <input
                className="input"
                type="email"
                value={settings.school_email || ''}
                onChange={e => set('school_email', e.target.value)}
                placeholder="info@school.edu"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Academic Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Calendar size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Academic Settings</h3>
            <p className="text-xs text-gray-500">Configure academic year and policies</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Academic Year</label>
            <input
              className="input"
              value={settings.academic_year || ''}
              onChange={e => set('academic_year', e.target.value)}
              placeholder="e.g. 2024-2025"
            />
          </div>
        </div>
      </div>

      {/* Library / Financial Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Financial & Library</h3>
            <p className="text-xs text-gray-500">Fee and library configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Currency</label>
            <select className="select" value={settings.currency || 'USD'} onChange={e => set('currency', e.target.value)}>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="BDT">BDT - Bangladeshi Taka</option>
            </select>
          </div>
          <div>
            <label className="label">Library Fine Per Day</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0"
                step="0.01"
                value={settings.fine_per_day || '2.00'}
                onChange={e => set('fine_per_day', e.target.value)}
                placeholder="2.00"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Fine charged per overdue day for library books</p>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="card bg-gray-50 border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-2 text-sm">About</h3>
        <div className="grid grid-cols-2 gap-y-1.5 text-sm text-gray-500">
          <span>Application</span><span className="font-medium text-gray-700">School Management System</span>
          <span>Version</span><span className="font-medium text-gray-700">1.0.0</span>
          <span>Database</span><span className="font-medium text-gray-700">SQLite (local)</span>
          <span>Framework</span><span className="font-medium text-gray-700">Electron + React</span>
        </div>
      </div>

      {/* Save button at bottom */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary px-8 ${saved ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : saved ? 'Changes Saved!' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
