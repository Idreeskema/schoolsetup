import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, BookOpen, ClipboardList,
  DollarSign, GraduationCap, BarChart3, Settings, ChevronLeft,
  ChevronRight, School
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Students', icon: Users, path: '/students' },
  { label: 'Employees', icon: UserCheck, path: '/employees' },
  { label: 'Classes', icon: GraduationCap, path: '/classes' },
  { label: 'Library', icon: BookOpen, path: '/library' },
  { label: 'Attendance', icon: ClipboardList, path: '/attendance' },
  { label: 'Fees', icon: DollarSign, path: '/fees' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' }
]

export default function Sidebar({ currentPage }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [schoolName, setSchoolName] = useState('School Management')

  useEffect(() => {
    if (window.api) {
      window.api.settings.get('school_name').then(res => {
        if (res.success && res.data) setSchoolName(res.data)
      })
    }
  }, [])

  return (
    <aside
      className="flex flex-col h-screen transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'linear-gradient(180deg, #1e3a5f 0%, #162d4a 100%)'
      }}
    >
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center flex-shrink-0 shadow-lg">
          <School size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm leading-tight truncate">{schoolName}</div>
            <div className="text-white/50 text-xs mt-0.5">Management System</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150
                ${isActive
                  ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center gap-3 px-2 py-2 rounded-lg text-white/60 hover:text-white
            hover:bg-white/10 transition-all duration-150
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {collapsed
            ? <ChevronRight size={18} />
            : <>
                <ChevronLeft size={18} />
                <span className="text-xs">Collapse</span>
              </>
          }
        </button>
      </div>

      {/* Developer Credit */}
      <div className="px-4 py-4 border-t border-white/10 bg-[#162d4a]/50">
        <a 
          href="https://idreeskema.github.io/portfolio/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 group transition-opacity hover:opacity-100 opacity-70"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
             <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">IK</div>
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1">Developed By</span>
              <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 truncate">Idrees Kema</span>
            </div>
          )}
        </a>
      </div>
    </aside>
  )
}
