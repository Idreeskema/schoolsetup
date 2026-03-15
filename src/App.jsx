import React, { useState, useEffect } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Employees from './pages/Employees'
import Library from './pages/Library'
import Attendance from './pages/Attendance'
import Fees from './pages/Fees'
import Classes from './pages/Classes'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

import Login from './pages/Login'
import LoadingScreen from './components/LoadingScreen'

const Router = window.api ? HashRouter : BrowserRouter

function Layout({ children, currentPage, setCurrentPage, onLogout, user }) {
  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar currentPage={currentPage} onLogout={onLogout} user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard')
  const [isReady, setIsReady] = useState(!!window.api)
  const [user, setUser] = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    // Check for existing session (simulate)
    const savedUser = localStorage.getItem('school_user')
    if (savedUser) setUser(JSON.parse(savedUser))

    if (!isReady) {
      const timer = setInterval(() => {
        if (window.api) {
          setIsReady(true)
          clearInterval(timer)
        }
      }, 100)
      return () => clearInterval(timer)
    }
  }, [isReady])

  const handleLogin = (userData) => {
    setIsAuthenticating(true)
    setTimeout(() => {
      setUser(userData)
      localStorage.setItem('school_user', JSON.stringify(userData))
      setIsAuthenticating(false)
    }, 2000)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('school_user')
  }

  if (!isReady) {
    return <LoadingScreen message="Initializing System..." />
  }

  if (isAuthenticating) {
    return <LoadingScreen message="Preparing Your Dashboard..." />
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <Layout currentPage="Dashboard" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Dashboard />
          </Layout>
        } />
        <Route path="/students" element={
          <Layout currentPage="Students" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Students />
          </Layout>
        } />
        <Route path="/employees" element={
          <Layout currentPage="Employees" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Employees />
          </Layout>
        } />
        <Route path="/library" element={
          <Layout currentPage="Library" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Library />
          </Layout>
        } />
        <Route path="/attendance" element={
          <Layout currentPage="Attendance" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Attendance />
          </Layout>
        } />
        <Route path="/fees" element={
          <Layout currentPage="Fees" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Fees />
          </Layout>
        } />
        <Route path="/classes" element={
          <Layout currentPage="Classes" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Classes />
          </Layout>
        } />
        <Route path="/reports" element={
          <Layout currentPage="Reports" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Reports />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout currentPage="Settings" setCurrentPage={setCurrentPage} onLogout={handleLogout} user={user}>
            <Settings />
          </Layout>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
