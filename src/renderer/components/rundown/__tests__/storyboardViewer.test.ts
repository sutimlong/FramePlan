import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImageAsset } from '@shared/schema'
import { StoryboardPicker } from '../StoryboardPicker'
import { StoryboardViewerBox } from '../StoryboardViewer'

/**
 * 分鏡圖片的兩種檢視方式：
 *   hover 縮圖 → 跟著游標的浮動小預覽（StoryboardHoverPreview，只在瀏覽器端以 portal 呈現）。
 *   點擊縮圖 → 大圖視窗（StoryboardViewer）。
 *
 * 大圖視窗本體用 portal 掛在 document.body，而 React 的伺服器渲染不支援 portal
 * （react-dom/server 會直接拋錯），所以這裡只測本體 StoryboardViewerBox：
 * 遮罩、對話框語意、圖片來源與關閉鈕。Esc 關閉、點背景關閉、開啟後焦點移動，
 * 屬於事件與焦點行為，SSR 無法驗證，需在應用程式中手動確認。
 */

/** 假 store 的內容：StoryboardPicker 的圖片來自 doc.assets（用途見下方的 vi.mock） */
const store = vi.hoisted(() => ({
  assets: {} as Record<string, { id: string; mime: string; dataBase64: string }>,
  addAsset: () => {},
  showToast: () => {},
}))

/**
 * zustand 在伺服器渲染時只會回傳「初始狀態」（getInitialState），測試裡對真 store 做的
 * setState 不會出現在 SSR 的輸出中；因此這個檔案以假 store 取代，讓縮圖能如實渲染。
 * 元件的型別仍由它對真 store 的 import 把關，這裡只替換執行時期的取值來源。
 */
vi.mock('@/store/useProjectStore', () => ({
  useProjectStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ doc: { assets: store.assets }, addAsset: store.addAsset, showToast: store.showToast }),
}))

const asset = (over: Partial<ImageAsset> = {}): ImageAsset => ({
  id: 'a1',
  mime: 'image/jpeg',
  dataBase64: 'AAAA',
  ...over,
})

/** 設定這次渲染要提供給 StoryboardPicker 的圖片 */
const setAssets = (assets: Record<string, ImageAsset>) => {
  store.assets = assets
}

const renderBox = (a: ImageAsset): string =>
  renderToStaticMarkup(
    createElement(StoryboardViewerBox, {
      asset: a,
      onClose: () => {},
      closeRef: createRef<HTMLButtonElement>(),
    }),
  )

const renderPicker = (assetIds: string[]): string =>
  renderToStaticMarkup(createElement(StoryboardPicker, { assetIds, onChange: () => {} }))

beforeEach(() => setAssets({}))

describe('StoryboardViewerBox（點縮圖開啟的大圖視窗）', () => {
  it('以對話框語意呈現，並掛在通用遮罩上（列印時會被 print.css 隱藏）', () => {
    const html = renderBox(asset())

    expect(html).toContain('class="modal-backdrop"')
    expect(html).toContain('class="sb-viewer"')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-label="分鏡大圖"')
  })

  it('以 data URI 顯示原圖（跟著 asset 的 mime 走，不重新編碼）', () => {
    const html = renderBox(asset({ mime: 'image/png', dataBase64: 'BBBB' }))

    expect(html).toContain('src="data:image/png;base64,BBBB"')
    expect(html).toContain('alt="分鏡"')
  })

  it('提供關閉鈕，且關閉鈕位於對話框內', () => {
    const html = renderBox(asset())

    expect(html).toContain('class="icon-btn sb-viewer-close"')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-label="關閉"')
    expect(html).toContain('title="關閉（Esc）"')
    expect(html.indexOf('class="icon-btn sb-viewer-close"')).toBeGreaterThan(html.indexOf('class="sb-viewer"'))
  })

  it('對話框是本體，遮罩在外面（點遮罩關閉、點圖片不關閉的結構前提）', () => {
    const html = renderBox(asset())

    expect(html.indexOf('class="modal-backdrop"')).toBeLessThan(html.indexOf('class="sb-viewer"'))
  })
})

describe('StoryboardPicker 的分鏡縮圖', () => {
  it('縮圖本身是按鈕（可用鍵盤開啟大圖），圖片仍顯示在按鈕內', () => {
    setAssets({ a1: asset() })
    const html = renderPicker(['a1'])

    expect(html).toContain('class="storyboard-thumb-btn"')
    expect(html).toContain('aria-label="放大檢視分鏡"')
    expect(html).toContain('title="點擊放大檢視"')
    expect(html).toContain('src="data:image/jpeg;base64,AAAA"')
  })

  it('尚未加入圖片時只顯示提示，沒有縮圖按鈕', () => {
    const html = renderPicker([])

    expect(html).toContain('尚未加入分鏡圖片')
    expect(html).not.toContain('storyboard-thumb-btn')
  })

  it('開啟大圖的按鈕與移除鈕是兩個獨立按鈕（HTML 不允許按鈕嵌套，且點移除不該開大圖）', () => {
    setAssets({ a1: asset() })
    const html = renderPicker(['a1'])

    const open = html.indexOf('class="storyboard-thumb-btn"')
    const openEnd = html.indexOf('</button>', open)
    const remove = html.indexOf('title="移除分鏡圖片"')

    expect(open).toBeGreaterThanOrEqual(0)
    expect(html.slice(open, openEnd)).not.toContain('移除分鏡圖片')
    expect(remove).toBeGreaterThan(openEnd)
  })

  it('一開始不會自動開啟大圖視窗，hover 小預覽也不在初始畫面（兩者都只在互動後才出現）', () => {
    setAssets({ a1: asset() })
    const html = renderPicker(['a1'])

    expect(html).not.toContain('role="dialog"')
    expect(html).not.toContain('sb-preview')
  })
})
