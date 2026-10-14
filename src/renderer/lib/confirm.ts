import type { ConfirmOptions } from '@shared/ipc-channels'

/**
 * 顯示確認對話框。
 * 桌面版走主程序的原生對話框（與存檔、關閉視窗的對話框一致）；
 * 若在瀏覽器中開發、沒有 preload 提供的 API，則退回瀏覽器內建的 confirm。
 */
export async function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  const api = window.electronAPI
  if (!api?.confirm) {
    const text = opts.detail ? `${opts.message}\n\n${opts.detail}` : opts.message
    return window.confirm(text)
  }
  return api.confirm(opts)
}
