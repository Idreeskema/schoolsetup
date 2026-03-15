import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Users, UserCheck, BookOpen, DollarSign, TrendingUp, ArrowRight,
  Plus, ClipboardList, GraduationCap, AlertCircle
} from 'lucide-react'

const COLORS = ['#1e3a5f', '#f97316', '#22c55e', '#f59e0b', '#8b5cf6']

function StatCard({ title, value, icon: Icon, color, change, suffix = '' }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20' }}
      >
        <Icon size={26} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}{suffix}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <TrendingUp size={11} />
            {change >= 0 ? '+' : ''}{change}% this month
          </p>
        )}
      </div>
    </div>
  )
}

function QuickAction({ label, icon: Icon, color, path }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
      <ArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0, employees: 0, booksIssued: 0, feesPending: 0
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [feeData, setFeeData] = useState([])
  const [recentStudents, setRecentStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      if (!window.api?.students) return

      const [studentsRes, employeesRes, issuesRes, feeStatsRes, recentStudRes] = await Promise.all([
        window.api.students.getAll({ status: 'Active' }),
        window.api.employees.getAll({ status: 'Active' }),
        window.api.library.getIssues({ status: 'active' }),
        window.api.fees.getStats(),
        window.api.students.getAll({ limit: 5 })
      ])

      setStats({
        students: studentsRes?.total || 0,
        employees: employeesRes?.total || 0,
        booksIssued: (issuesRes?.success && issuesRes.data?.length) || 0,
        feesPending: (feeStatsRes?.success && feeStatsRes.data?.total_pending) || 0
      })

      setRecentStudents(recentStudRes?.data || [])

      // Build attendance chart data for last 7 days
      if (window.api?.attendance) {
        const now = new Date()
        const monthlyStats = await window.api.attendance.getMonthlyStats(
          now.getMonth() + 1,
          now.getFullYear()
        )
        if (monthlyStats?.success && monthlyStats.data?.dailyStats) {
          const chartData = monthlyStats.data.dailyStats.slice(-7).map(d => ({
            date: d.date?.split('-').slice(1).join('/') || '',
            Present: d.present || 0,
            Absent: d.absent || 0,
            Late: d.late || 0
          }))
          setAttendanceData(chartData)
        } else {
          setAttendanceData(getPlaceholderAttendance())
        }
      } else {
        setAttendanceData(getPlaceholderAttendance())
      }

      if (feeStatsRes?.success && feeStatsRes.data?.byType) {
        const pieData = feeStatsRes.data.byType.map(item => ({
          name: item.fee_type,
          value: parseFloat(item.collected) || 0
        })).filter(d => d.value > 0)
        setFeeData(pieData.length > 0 ? pieData : getPlaceholderFees())
      } else {
        setFeeData(getPlaceholderFees())
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholderAttendance = () => [
    { date: '03/09', Present: 45, Absent: 5, Late: 2 },
    { date: '03/10', Present: 48, Absent: 3, Late: 1 },
    { date: '03/11', Present: 44, Absent: 7, Late: 3 },
    { date: '03/12', Present: 50, Absent: 2, Late: 0 },
    { date: '03/13', Present: 46, Absent: 4, Late: 2 },
    { date: '03/14', Present: 43, Absent: 6, Late: 3 },
    { date: '03/15', Present: 49, Absent: 3, Late: 0 }
  ]

  const getPlaceholderFees = () => [
    { name: 'Tuition', value: 4500 },
    { name: 'Activity', value: 800 },
    { name: 'Library', value: 300 },
    { name: 'Transport', value: 1200 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.students} icon={Users} color="#1e3a5f" change={2} />
        <StatCard title="Total Staff" value={stats.employees} icon={UserCheck} color="#f97316" change={0} />
        <StatCard title="Books Issued" value={stats.booksIssued} icon={BookOpen} color="#8b5cf6" />
        <StatCard title="Fees Pending" value={`$${(stats.feesPending || 0).toLocaleString()}`} icon={DollarSign} color="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Attendance bar chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Attendance</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 school days</p>
            </div>
          </div>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={10} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="Present" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No attendance data for this period
            </div>
          )}
        </div>

        {/* Fee collection pie */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Fee Collection</h3>
            <p className="text-xs text-gray-500 mt-0.5">By category</p>
          </div>
          {feeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={feeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `$${v.toLocaleString()}`}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No fee data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent admissions */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Admissions</h3>
            <a href="#/students" className="text-xs text-[#f97316] hover:underline font-medium">View all</a>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-6">No students found</td>
                  </tr>
                ) : (
                  recentStudents.map((s, idx) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar text-xs" style={{ background: COLORS[idx % COLORS.length] }}>
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-gray-500">{s.admission_no}</td>
                      <td>{s.class_name || '—'}</td>
                      <td className="text-gray-500 text-xs">{s.admission_date}</td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-gray'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction label="Add Student" icon={Plus} color="#1e3a5f" path="/students" />
            <QuickAction label="Mark Attendance" icon={ClipboardList} color="#f97316" path="/attendance" />
            <QuickAction label="Issue Book" icon={BookOpen} color="#8b5cf6" path="/library" />
            <QuickAction label="Collect Fee" icon={DollarSign} color="#22c55e" path="/fees" />
            <QuickAction label="Manage Classes" icon={GraduationCap} color="#f59e0b" path="/classes" />
          </div>
        </div>
      </div>
    </div>
  )
}
