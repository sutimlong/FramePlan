import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { UpdateReminder } from '../UpdateReminder'
import type { UpdateInfo } from '@/lib/updateCheck'

/**
 * 更新提醒視窗的結構測試（node 環境、不需 DOM，沿用 StoryboardViewer 的 SSR 寫法）。
 * Esc 關閉屬於事件行為，SSR 無法驗證，需在應用程式中手動確認。
 */

const baseInfo: UpdateInfo = {
  tag: 'v1.3.0',
  url: 'https://github.com/sutimlong/FramePlan/releases/tag/v1.3.0',
  currentVersion: '1.2.3',
}

const render = (over: Partial<UpdateInfo> = {}): string =>
  renderToStaticMarkup(
    createElement(UpdateReminder, {
      info: { ...baseInfo, ...over },
      onDownload: () => {},
      onSkip: () => {},
      onClose: () => {},
    }),
  )

describe('UpdateReminder（有新版本時的提醒視窗）', () => {
  it('以對話框語意呈現，並掛在通用遮罩上（列印時會被 print.css 隱藏）', () => {
    const html = render()

    expect(html).toContain('class="modal-backdrop"')
    expect(html).toContain('class="modal"')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-label="發現新版本"')
  })

  it('顯示目前版本與 GitHub 上的最新版本', () => {
    const html = render()

    expect(html).toContain('v1.2.3')
    expect(html).toContain('v1.3.0')
  })

  it('提供「前往下載」與「跳過此版本」兩個動作', () => {
    const html = render()

    expect(html).toContain('前往下載')
    expect(html).toContain('跳過此版本')
    expect(html).toContain('class="btn primary"')
  })

  it('提供稍後（關閉）按鈕，關閉視窗但不跳過版本', () => {
    const html = render()

    expect(html).toContain('aria-label="稍後"')
    expect(html).toContain('title="稍後"')
  })
})
