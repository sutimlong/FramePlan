import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppShell'
import { getAppName, initAppInfo } from '@/lib/appInfo'
import './styles/app.css'
import './styles/print.css'

async function bootstrap(): Promise<void> {
  // 先取得應用程式名稱再渲染，側邊欄才能顯示正確名稱而不閃爍
  await initAppInfo()
  // index.html 的 <title> 僅為初始後備值，這裡以實際應用程式名稱覆寫
  document.title = getAppName()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
