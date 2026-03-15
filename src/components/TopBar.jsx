import React, { useState, useEffect } from 'react'
import { Bell, Calendar, User, ChevronDown, LogIn } from 'lucide-react'

export default function TopBar({ currentPage, onLogout, user }) {
  const [schoolName, setSchoolName] = useState('School Management System')
  const [currentDate, setCurrentDate] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    if (window.api) {
      window.api.settings.get('school_name').then(res => {
        if (res.success && res.data) setSchoolName(res.data)
      })
    }

    const updateDate = () => {
      const now = new Date()
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      setCurrentDate(now.toLocaleDateString('en-US', options))
    }
    updateDate()
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm z-30">
      {/* Left: Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{currentPage}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{schoolName}</p>
      </div>

      {/* Right: Date, notifications, user */}
      <div className="flex items-center gap-3">
        {/* Date */}
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
          <Calendar size={14} className="text-[#1e3a5f]" />
          <span>{currentDate}</span>
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f97316] rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${showUserMenu ? 'bg-gray-100 active:scale-95' : 'hover:bg-gray-50'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#3b82f6] flex items-center justify-center shadow-md">
              <User size={15} className="text-white" />
            </div>
            <div className="hidden md:block text-left mr-1">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">{user?.role || 'Admin'}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Signed in as</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{user?.name}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-red-100/50 group-hover:bg-red-100 transition-colors">
                    <LogIn size={14} className="rotate-180" />
                  </div>
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
