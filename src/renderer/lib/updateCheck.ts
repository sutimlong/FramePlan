/**
 * 版本更新檢查（每天一次）與「跳過此版本」的記錄。
 *
 * 主程序只負責向 GitHub 查詢最新 release 的 tag／下載頁；
 * 是否要提醒使用者（版本是否較新、今天是否已查過、是否已跳過該版本）由這裡決定。
 * 記錄保存在 localStorage，因此關閉再開仍會保留。
 */

/** 更新提醒所需的資訊 */
export interface UpdateInfo {
  /** GitHub 最新 release 的 tag（例如 v1.3.0） */
  tag: string
  /** 最新 release 的下載頁網址 */
  url: string
  /** 目前安裝的版本（例如 1.2.3） */
  currentVersion: string
}

/** 上次偵測日期（YYYY-MM-DD）：確保每天只檢查一次 */
const LAST_CHECK_DATE_KEY = 'frameplan.update.lastCheckDate'
/** 使用者按下「跳過此版本」的 tag：同一版本不再提醒，直到出現更新的版本 */
const SKIPPED_VERSION_KEY = 'frameplan.update.skippedVersion'

/** 取出語意化版本中的數字三元組；無法解析時回傳 null */
function parseVersion(v: string): [number, number, number] | null {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(v.trim().replace(/^v/i, ''))
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/**
 * 比對兩個版本：回傳負數表示 a 較舊、0 表示相同、正數表示 a 較新。
 * 可接受前導 v（例如 v1.2.3）；無法解析成 x.y.z 時退回字串比較。
 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (pa && pb) {
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pa[i] - pb[i]
    }
    return 0
  }
  return a.trim().localeCompare(b.trim())
}

/** candidate 是否比 current 新 */
export function isNewerVersion(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0
}

/**
 * 本地日期字串（YYYY-MM-DD）。
 * 不使用 toISOString()，因為那是 UTC 日期，跨時區時會與使用者的「今天」不一致。
 */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 無法寫入（例如隱私模式）時忽略；更新提醒仍可運作，只是每天會重新偵測
  }
}

/**
 * 檢查是否有新版本。每天最多偵測一次；已跳過的版本不再提醒。
 * 回傳 null 表示不需要顯示提醒（今天已查過、沒有新版本、已跳過、或查詢失敗）。
 */
export async function checkForUpdates(currentVersion: string): Promise<UpdateInfo | null> {
  const today = localDateKey()
  if (readStorage(LAST_CHECK_DATE_KEY) === today) return null
  // 先記錄今天已偵測，無論後續查詢成功與否都不再重複打 GitHub API
  writeStorage(LAST_CHECK_DATE_KEY, today)

  const api = window.electronAPI
  if (!api?.checkUpdate) return null
  const result = await api.checkUpdate()
  if (!result.ok) return null

  if (readStorage(SKIPPED_VERSION_KEY) === result.tag) return null
  if (!isNewerVersion(result.tag, currentVersion)) return null

  return { tag: result.tag, url: result.url, currentVersion }
}

/** 記住使用者跳過的版本；之後只有在出現更新的版本時才會再提醒 */
export function markSkippedVersion(tag: string): void {
  writeStorage(SKIPPED_VERSION_KEY, tag)
}
