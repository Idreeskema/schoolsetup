const { contextBridge, ipcRenderer } = require('electron')

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('api', {
  students: {
    getAll: (filters) => invoke('students:getAll', filters),
    getById: (id) => invoke('students:getById', id),
    create: (data) => invoke('students:create', data),
    update: (id, data) => invoke('students:update', id, data),
    delete: (id) => invoke('students:delete', id),
    importFromExcel: (filePath, columnMap) => invoke('students:importFromExcel', filePath, columnMap)
  },
  employees: {
    getAll: (filters) => invoke('employees:getAll', filters),
    getById: (id) => invoke('employees:getById', id),
    create: (data) => invoke('employees:create', data),
    update: (id, data) => invoke('employees:update', id, data),
    delete: (id) => invoke('employees:delete', id),
    importFromExcel: (filePath, columnMap) => invoke('employees:importFromExcel', filePath, columnMap)
  },
  classes: {
    getAll: (filters) => invoke('classes:getAll', filters),
    create: (data) => invoke('classes:create', data),
    update: (id, data) => invoke('classes:update', id, data),
    delete: (id) => invoke('classes:delete', id)
  },
  library: {
    getBooks: (filters) => invoke('library:getBooks', filters),
    addBook: (data) => invoke('library:addBook', data),
    updateBook: (id, data) => invoke('library:updateBook', id, data),
    issueBook: (bookId, studentId, dueDate) => invoke('library:issueBook', bookId, studentId, dueDate),
    returnBook: (issueId) => invoke('library:returnBook', issueId),
    getIssues: (filters) => invoke('library:getIssues', filters),
    importBooks: (filePath, columnMap) => invoke('library:importBooks', filePath, columnMap)
  },
  attendance: {
    markBulk: (classId, date, records) => invoke('attendance:markBulk', classId, date, records),
    getByClass: (classId, date) => invoke('attendance:getByClass', classId, date),
    getReport: (studentId, month, year) => invoke('attendance:getReport', studentId, month, year),
    getMonthlyStats: (month, year) => invoke('attendance:getMonthlyStats', month, year)
  },
  fees: {
    getAll: (filters) => invoke('fees:getAll', filters),
    create: (data) => invoke('fees:create', data),
    markPaid: (id) => invoke('fees:markPaid', id),
    generateReceipt: (id) => invoke('fees:generateReceipt', id),
    getStats: () => invoke('fees:getStats'),
    getFeeTypes: () => invoke('fees:getFeeTypes')
  },
  settings: {
    get: (key) => invoke('settings:get', key),
    set: (key, value) => invoke('settings:set', key, value),
    getAll: () => invoke('settings:getAll')
  },
  dialog: {
    openFile: (options) => invoke('dialog:openFile', options),
    saveFile: (options) => invoke('dialog:saveFile', options)
  },
  reports: {
    exportToExcel: (options) => invoke('reports:exportToExcel', options)
  }
})
