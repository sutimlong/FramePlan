import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react'
import type { WeatherCondition, WeatherInfo } from '@shared/schema'
import { dash } from './DayParts'

/** 天氣狀況對應的圖示（與 24 小時制天氣圖示一致的線條風格） */
const ICONS: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
}

/** 將 "06:56" 轉為通告表慣用的 12 小時制 "6:56 AM" */
export function formatTime12h(value?: string): string {
  const trimmed = (value ?? '').trim()
  const m = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return dash(trimmed)
  const h24 = parseInt(m[1], 10)
  const hour = h24 % 12 === 0 ? 12 : h24 % 12
  return `${hour}:${m[2]} ${h24 >= 12 ? 'PM' : 'AM'}`
}

/**
 * 天氣區塊：低溫／天氣圖示／高溫 + 天氣概況 + 日出日落
 * 版型對應通告表的標準天氣欄位（43 °F ☀ 64 °F ／ low ／ high ／ Sunrise / Sunset）
 */
export function DayWeather({ w }: { w?: WeatherInfo }) {
  const unit = `°${w?.tempUnit || 'C'}`
  const Icon = (w && ICONS[w.condition]) || Sun
  return (
    <div className="cs-weather">
      <h3>天氣</h3>
      <div className="temps">
        <div className="temp">
          <b>{w?.low != null ? `${w.low} ${unit}` : '--'}</b>
          <small>最低溫</small>
        </div>
        <Icon className="cond-icon" size={22} />
        <div className="temp">
          <b>{w?.high != null ? `${w.high} ${unit}` : '--'}</b>
          <small>最高溫</small>
        </div>
      </div>
      {w?.summary ? <p className="summary">{w.summary}</p> : null}
      <p className="sun">
        <span>
          <Sunrise className="sun-icon" size={18} aria-hidden="true" />
          日出: {formatTime12h(w?.sunrise)}
        </span>
        <span>
          <Sunset className="sun-icon" size={18} aria-hidden="true" />
          日落: {formatTime12h(w?.sunset)}
        </span>
      </p>
    </div>
  )
}
