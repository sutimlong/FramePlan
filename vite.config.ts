import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const r = (p: string) => path.resolve(import.meta.dirname, p)

// 版本號的唯一來源：package.json（主程序 app.getVersion() 也讀同一個檔案）
const pkg = JSON.parse(readFileSync(r('package.json'), 'utf8')) as { version: string }

export default defineConfig({
  root: r('src/renderer'),
  base: './',
  define: {
    // 渲染端以 __APP_VERSION__ 取得版本（見 src/renderer/types/globals.d.ts）
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: r('src/main/index.ts'),
        // renderer 的 Vite root 是 src/renderer，必須明確指定 Electron 的工作目錄為專案根目錄
        onstart({ startup }) {
          void startup(['.'], { cwd: r('.') })
        },
        vite: {
          resolve: { alias: { '@shared': r('src/shared') } },
          build: {
            outDir: r('dist-electron'),
            emptyOutDir: true,
            rolldownOptions: { external: ['electron'] },
          },
        },
      },
    }),
  ],
  resolve: { alias: { '@shared': r('src/shared'), '@': r('src/renderer') } },
  build: {
    outDir: r('dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 40 },
            {
              name: 'slate',
              test: /node_modules[\\/](slate|slate-react|slate-dom|slate-history|immer|is-hotkey)[\\/]/,
              priority: 30,
            },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 30 },
            { name: 'dnd', test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 30 },
          ],
        },
      },
    },
  },
})
