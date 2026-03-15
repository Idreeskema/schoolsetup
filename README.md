# School Management System

A comprehensive desktop application for managing school operations including students, employees, fees, attendance, library, and classes.

## Features

- **Student Management** - Add, edit, and manage student records
- **Employee Management** - Manage staff and teacher information
- **Fee Management** - Track and manage student fees
- **Attendance System** - Daily student and employee attendance tracking
- **Library Management** - Book inventory and lending system
- **Class Management** - Organize classes and sections
- **Reports** - Generate various reports

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS
- **Desktop Framework**: Electron 29
- **Database**: SQLite (better-sqlite3)
- **Build Tool**: electron-vite
- **Charts**: Recharts
- **Excel Import**: xlsx

## Prerequisites

Before running the application, make sure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **Git** (for cloning and version control)
   - Download from: https://git-scm.com/

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Idreeskema/schoolsetup.git
cd schoolsetup
```

### Step 2: Install Dependencies

```bash
npm install
```

This will automatically run `postinstall` script to rebuild the `better-sqlite3` native module for Electron.

### Step 3: Run in Development Mode

```bash
npm run dev
```

The application will open in development mode with hot reload.

## Building for Production

### Build the Application

```bash
npm run build
```

### Package as Windows Executable

```bash
npm run package:win
```

The executable will be created in the `release` or `dist` folder.

## Project Structure

```
school-management/
├── electron/           # Electron main process
│   ├── main.js        # Main entry point
│   ├── preload.js     # Preload scripts
│   └── ipc/           # IPC handlers for database operations
├── src/               # React frontend
│   ├── components/    # Reusable UI components
│   ├── pages/        # Page components
│   ├── styles/       # Global styles
│   └── main.jsx      # React entry point
├── resources/        # App resources (icons, etc.)
├── package.json      # Project dependencies
└── electron-builder.yml  # Build configuration
```

## Database

The application uses SQLite database which is automatically created on first run. The database file is stored in the user's app data directory.

## Default Login

On first run, you can create an admin account or use the default credentials (if set up).

## Troubleshooting

### Native Module Build Errors

If you encounter issues with `better-sqlite3`, rebuild it manually:

```bash
npm run rebuild
```

### Clean Install

If you face persistent issues, try a clean install:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## License

MIT License

## Author

Idrees Kema
