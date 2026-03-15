import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'

// Set app name explicitly to ensure consistent userData path
app.name = 'school-management'

import { initDb } from './ipc/db'
import { register as registerStudents } from './ipc/students'
import { register as registerEmployees } from './ipc/employees'
import { register as registerClasses } from './ipc/classes'
import { register as registerLibrary } from './ipc/library'
import { register as registerAttendance } from './ipc/attendance'
import { register as registerFees } from './ipc/fees'

let mainWindow
let db

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: process.env.NODE_ENV !== 'development'
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function initializeDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'school.db')

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  db = initDb(dbPath)
  return db
}

function registerIpcHandlers(db) {
  registerStudents(ipcMain, db)
  registerEmployees(ipcMain, db)
  registerClasses(ipcMain, db)
  registerLibrary(ipcMain, db)
  registerAttendance(ipcMain, db)
  registerFees(ipcMain, db)

  // Settings handlers
  ipcMain.handle('settings:getAll', () => {
    try {
      const rows = db.prepare('SELECT key, value FROM settings').all()
      const result = {}
      rows.forEach(r => { result[r.key] = r.value })
      return { success: true, data: result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('settings:get', (_, key) => {
    try {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
      return { success: true, data: row ? row.value : null }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('settings:set', (_, key, value) => {
    try {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // Dialog handlers
  ipcMain.handle('dialog:openFile', async (_, options) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options?.filters || [
          { name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }
        ]
      })
      if (result.canceled) return { success: true, data: null }
      return { success: true, data: result.filePaths[0] }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('dialog:saveFile', async (_, options) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: options?.filters || [
          { name: 'Excel Files', extensions: ['xlsx'] }
        ],
        defaultPath: options?.defaultPath || 'export.xlsx'
      })
      if (result.canceled) return { success: true, data: null }
      return { success: true, data: result.filePath }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // Reports export handler
  ipcMain.handle('reports:exportToExcel', async (_, { data, sheetName, filePath }) => {
    try {
      const XLSX = require('xlsx')
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Report')
      XLSX.writeFile(wb, filePath)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}

app.whenReady().then(() => {
  try {
    db = initializeDatabase()
    registerIpcHandlers(db)
    createWindow()
  } catch (err) {
    console.error('Failed to initialize:', err)
    dialog.showErrorBox('Initialization Error', err.message)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      try { db.close() } catch (e) {}
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  if (db) {
    try { db.close() } catch (e) {}
  }
})
