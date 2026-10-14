import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const r = (p: string) => path.resolve(import.meta.dirname, p)

// 與 vite.config.ts 相同：版本號的唯一來源是 package.json
const pkg = JSON.parse(readFileSync(r('package.json'), 'utf8')) as { version: string }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '@shared': r('src/shared'), '@': r('src/renderer') } },
  test: {
    // 測試對象皆為純邏輯（schema、遷移、工具函式、運輸檢查），不需要 DOM
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
})
