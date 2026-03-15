import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Plugin to copy the ipc folder into out/main/ipc after build
function copyIpcPlugin() {
  return {
    name: 'copy-ipc-files',
    closeBundle() {
      const src = resolve(__dirname, 'electron/ipc')
      const dest = resolve(__dirname, 'out/main/ipc')
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
      }
      const files = fs.readdirSync(src)
      files.forEach(file => {
        fs.copyFileSync(path.join(src, file), path.join(dest, file))
      })
      console.log('[copy-ipc-plugin] Copied ipc files to out/main/ipc')
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyIpcPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main.js')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload.js')
        }
      }
    }
  },
  renderer: {
    root: 'src',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/index.html')
        }
      }
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
