import { WEATHER_CONDITION_LABELS, type WeatherCondition, type WeatherInfo } from '@shared/schema'

export interface WeatherFetchResult {
  weather: WeatherInfo
  locationName: string
  message: string
}

/** 溫度單位（與 WeatherInfo.tempUnit 同步） */
type TempUnit = WeatherInfo['tempUnit']

interface LocationCoord {
  name: string
  lat: number
  lng: number
}

const TAIWAN_CITIES: Array<{ keywords: string[]; name: string; lat: number; lng: number }> = [
  { keywords: ['台北', '臺北'], name: '台北市', lat: 25.0375, lng: 121.5637 },
  { keywords: ['新北'], name: '新北市', lat: 25.0118, lng: 121.4658 },
  { keywords: ['基隆'], name: '基隆市', lat: 25.1325, lng: 121.7445 },
  { keywords: ['桃園'], name: '桃園市', lat: 24.9936, lng: 121.3010 },
  { keywords: ['新竹市'], name: '新竹市', lat: 24.8039, lng: 120.9647 },
  { keywords: ['新竹'], name: '新竹縣', lat: 24.8387, lng: 121.0177 },
  { keywords: ['苗栗'], name: '苗栗縣', lat: 24.5650, lng: 120.8207 },
  { keywords: ['台中', '臺中'], name: '台中市', lat: 24.1627, lng: 120.6474 },
  { keywords: ['彰化'], name: '彰化縣', lat: 24.0817, lng: 120.5385 },
  { keywords: ['南投'], name: '南投縣', lat: 23.9099, lng: 120.6853 },
  { keywords: ['雲林'], name: '雲林縣', lat: 23.7092, lng: 120.4313 },
  { keywords: ['嘉義市'], name: '嘉義市', lat: 23.4800, lng: 120.4491 },
  { keywords: ['嘉義'], name: '嘉義縣', lat: 23.4518, lng: 120.2559 },
  { keywords: ['台南', '臺南'], name: '台南市', lat: 22.9997, lng: 120.2270 },
  { keywords: ['高雄'], name: '高雄市', lat: 22.6273, lng: 120.3014 },
  { keywords: ['屏東', '恆春', '墾丁'], name: '屏東縣', lat: 22.0042, lng: 120.7444 },
  { keywords: ['宜蘭', '礁溪', '羅東'], name: '宜蘭縣', lat: 24.7570, lng: 121.7530 },
  { keywords: ['花蓮'], name: '花蓮縣', lat: 23.9912, lng: 121.6196 },
  { keywords: ['台東', '臺東'], name: '台東縣', lat: 22.7583, lng: 121.1444 },
  { keywords: ['澎湖'], name: '澎湖縣', lat: 23.5654, lng: 119.5793 },
  { keywords: ['金門'], name: '金門縣', lat: 24.4489, lng: 118.3766 },
  { keywords: ['連江', '馬祖'], name: '連江縣', lat: 26.1558, lng: 119.9288 },
  { keywords: ['陽明山'], name: '陽明山', lat: 25.1558, lng: 121.5475 },
]

export function mapWmoCode(code: number): { condition: WeatherCondition; label: string } {
  switch (code) {
    case 0:
      return { condition: 'sunny', label: '晴天' }
    case 1:
      return { condition: 'sunny', label: '晴時多雲' }
    case 2:
      return { condition: 'partly-cloudy', label: '多雲時晴' }
    case 3:
      return { condition: 'cloudy', label: '陰天' }
    case 45:
    case 48:
      return { condition: 'fog', label: '起霧' }
    case 51:
    case 53:
    case 55:
      return { condition: 'rain', label: '短暫雨' }
    case 56:
    case 57:
      return { condition: 'rain', label: '短暫雨' }
    case 61:
    case 63:
    case 65:
      return { condition: 'rain', label: '下雨' }
    case 66:
    case 67:
      return { condition: 'rain', label: '雨夾雪' }
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: 'snow', label: '下雪' }
    case 80:
    case 81:
    case 82:
      return { condition: 'rain', label: '陣雨' }
    case 85:
    case 86:
      return { condition: 'snow', label: '陣雪' }
    case 95:
    case 96:
    case 99:
      // 標籤與 UI 選單、通告表列印共用同一份定義
      return { condition: 'storm', label: WEATHER_CONDITION_LABELS.storm }
    default:
      return { condition: 'partly-cloudy', label: '多雲' }
  }
}

/**
 * 16 方位風向中文名稱，索引 0 為北。
 * 天氣概況一律以中文呈現，因此不使用 N／ESE 之類的英文縮寫。
 */
const COMPASS = [
  '北',
  '北北東',
  '東北',
  '東北東',
  '東',
  '東南東',
  '東南',
  '南南東',
  '南',
  '南南西',
  '西南',
  '西南西',
  '西',
  '西北西',
  '西北',
  '北北西',
]

const roundOrNull = (v: number | null | undefined): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null

/** 將攝氏溫度換算為指定單位（API 一律回傳攝氏） */
const convertTemp = (celsius: number, unit: TempUnit): number =>
  unit === 'F' ? Math.round((celsius * 9) / 5 + 32) : Math.round(celsius)

/** 依使用者選擇的單位換算氣溫；null 代表沒有資料 */
const toUnit = (celsius: number | null | undefined, unit: TempUnit): number | null =>
  typeof celsius === 'number' && Number.isFinite(celsius) ? convertTemp(celsius, unit) : null

/** 風向角度轉為中文方位（如 121° → 東南東），沒有資料時回傳空字串 */
export function toCompass(degrees: number | null | undefined): string {
  if (typeof degrees !== 'number' || !Number.isFinite(degrees)) return ''
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 22.5) % 16]
}

/** 以日照時數占白晝長度比例推估「日照機率」（%） */
function toSunshineChance(
  sunshineSeconds: number | null | undefined,
  daylightSeconds: number | null | undefined,
): number | null {
  if (
    typeof sunshineSeconds !== 'number' ||
    typeof daylightSeconds !== 'number' ||
    !Number.isFinite(sunshineSeconds) ||
    !Number.isFinite(daylightSeconds) ||
    daylightSeconds <= 0
  ) {
    return null
  }
  const ratio = (sunshineSeconds / daylightSeconds) * 100
  return Math.max(0, Math.min(100, Math.round(ratio)))
}

/**
 * 組出天氣概況文字（中文）：
 * 「陣雨，降雨機率 60%，日照機率 10%。風速 12 公里/小時 東南東」
 * 缺少的資料（例如歷史紀錄沒有降雨機率）會自動略過。
 *
 * `label` 為天氣狀況的細分名稱（來自 mapWmoCode，例如「陣雨」、「短暫雨」）；
 * 未提供時退回 WEATHER_CONDITION_LABELS 的一般名稱（例如「下雨」），
 * 兩者都與「天氣狀況」選單、通告表列印使用同一套中文標籤。
 */
export function buildWeatherSummary(p: {
  condition: WeatherCondition
  label?: string
  rainChance?: number | null
  sunshineChance?: number | null
  windSpeed?: number | null
  windDir?: string
}): string {
  const segments: string[] = []
  if (p.rainChance != null) segments.push(`降雨機率 ${p.rainChance}%`)
  if (p.sunshineChance != null) segments.push(`日照機率 ${p.sunshineChance}%`)

  let text = p.label?.trim() || WEATHER_CONDITION_LABELS[p.condition] || WEATHER_CONDITION_LABELS.sunny
  if (segments.length > 0) text += `，${segments.join('，')}`
  text += '。'
  // 風速單位沿用 Open-Meteo 的預設值（公里/小時）
  if (p.windSpeed != null && p.windDir) text += `風速 ${p.windSpeed} 公里/小時 ${p.windDir}`
  return text
}

/** 依據地址或地名解析經緯度 */
async function resolveCoordinates(address?: string): Promise<LocationCoord> {
  const trimmed = address?.trim()
  if (!trimmed) {
    return { name: '台北市', lat: 25.0375, lng: 121.5637 }
  }

  for (const item of TAIWAN_CITIES) {
    if (item.keywords.some((k) => trimmed.includes(k))) {
      return { name: item.name, lat: item.lat, lng: item.lng }
    }
  }

  // 嘗試線上地理編碼
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'CallsheetBuilder/1.0' },
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          name: trimmed.slice(0, 10),
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }
      }
    }
  } catch {
    // 忽略線上編碼錯誤，退回預設
  }

  return { name: '台北市', lat: 25.0375, lng: 121.5637 }
}

function parseTimePart(isoOrTimeStr: string): string {
  if (!isoOrTimeStr) return ''
  if (isoOrTimeStr.includes('T')) {
    return isoOrTimeStr.split('T')[1].slice(0, 5)
  }
  const match = isoOrTimeStr.match(/^(\d+):(\d+)(?::\d+)?\s*(AM|PM)?$/i)
  if (match) {
    let hours = parseInt(match[1], 10)
    const minutes = match[2].padStart(2, '0')
    const ampm = match[3]?.toUpperCase()
    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }
  return isoOrTimeStr.slice(0, 5)
}

/**
 * 依據拍攝日期及拍攝地點，向天氣 API 查詢並回傳天氣資料。
 * API 回傳的氣溫一律是攝氏，會依 `tempUnit` 換算成使用者選擇的單位後才回傳。
 */
export async function fetchWeatherForDay(
  dateStr: string,
  locationAddress?: string,
  tempUnit: TempUnit = 'C',
): Promise<WeatherFetchResult> {
  const dateTrimmed = dateStr?.trim()
  if (!dateTrimmed) {
    throw new Error('請先於上方填寫「拍攝日期」')
  }

  // 檢查日期格式 YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTrimmed)) {
    throw new Error('拍攝日期格式不正確，需為 YYYY-MM-DD')
  }

  const coord = await resolveCoordinates(locationAddress)

  const todayStr = new Date().toISOString().slice(0, 10)
  const targetTime = new Date(`${dateTrimmed}T00:00:00`).getTime()
  const todayTime = new Date(`${todayStr}T00:00:00`).getTime()
  const diffDays = Math.round((targetTime - todayTime) / (1000 * 3600 * 24))

  // 情況 1：在 Open-Meteo 氣象預報有效範圍內 (-90 天到 +16 天)
  if (diffDays >= -90 && diffDays <= 16) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,sunshine_duration,daylight_duration,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto&start_date=${dateTrimmed}&end_date=${dateTrimmed}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`無法取得天氣資訊 (${res.status})`)
    }
    const data = await res.json()
    const d = data.daily
    if (!d || !d.time || d.time.length === 0) {
      throw new Error('未取得該日期的氣象資料')
    }

    const code = d.weather_code?.[0] ?? 0
    const { condition, label } = mapWmoCode(code)
    const low = toUnit(d.temperature_2m_min?.[0], tempUnit)
    const high = toUnit(d.temperature_2m_max?.[0], tempUnit)
    const sunrise = parseTimePart(d.sunrise?.[0] ?? '')
    const sunset = parseTimePart(d.sunset?.[0] ?? '')
    const precipProb = d.precipitation_probability_max?.[0]

    const summary = buildWeatherSummary({
      condition,
      label,
      rainChance: roundOrNull(precipProb),
      sunshineChance: toSunshineChance(d.sunshine_duration?.[0], d.daylight_duration?.[0]),
      windSpeed: roundOrNull(d.wind_speed_10m_max?.[0]),
      windDir: toCompass(d.wind_direction_10m_dominant?.[0]),
    })

    return {
      weather: {
        tempUnit,
        low,
        high,
        condition,
        sunrise,
        sunset,
        summary,
      },
      locationName: coord.name,
      message: `已填入「${dateTrimmed}」${coord.name}氣象預報（${label}，${low}°${tempUnit} ~ ${high}°${tempUnit}）`,
    }
  }

  // 情況 2：歷史日期（超過 90 天前）
  if (diffDays < -90) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coord.lat}&longitude=${coord.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,sunshine_duration,daylight_duration,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto&start_date=${dateTrimmed}&end_date=${dateTrimmed}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`無法取得歷史天氣資訊 (${res.status})`)
    }
    const data = await res.json()
    const d = data.daily
    const code = d.weather_code?.[0] ?? 0
    const { condition, label } = mapWmoCode(code)
    const low = toUnit(d.temperature_2m_min?.[0], tempUnit)
    const high = toUnit(d.temperature_2m_max?.[0], tempUnit)
    const sunrise = parseTimePart(d.sunrise?.[0] ?? '')
    const sunset = parseTimePart(d.sunset?.[0] ?? '')

    // 歷史資料 API 未提供降雨機率，該段文字會自動省略
    const summary = buildWeatherSummary({
      condition,
      label,
      sunshineChance: toSunshineChance(d.sunshine_duration?.[0], d.daylight_duration?.[0]),
      windSpeed: roundOrNull(d.wind_speed_10m_max?.[0]),
      windDir: toCompass(d.wind_direction_10m_dominant?.[0]),
    })

    return {
      weather: {
        tempUnit,
        low,
        high,
        condition,
        sunrise,
        sunset,
        summary,
      },
      locationName: coord.name,
      message: `已填入「${dateTrimmed}」歷史天氣紀錄`,
    }
  }

  // 情況 3：日期超過 16 天以上（數值預報模型限制最多預報 16 天）
  // 透過日出日落天文 API 取得精確日出日落，並查詢前一年同期氣溫作為預估氣候參考
  let sunrise = ''
  let sunset = ''
  try {
    const sunRes = await fetch(
      `https://api.sunrisesunset.io/json?lat=${coord.lat}&lng=${coord.lng}&date=${dateTrimmed}&timezone=Asia/Taipei`,
    )
    if (sunRes.ok) {
      const sunData = await sunRes.json()
      if (sunData.results) {
        sunrise = parseTimePart(sunData.results.sunrise ?? '')
        sunset = parseTimePart(sunData.results.sunset ?? '')
      }
    }
  } catch {
    // 忽略
  }

  // 嘗試查詢前一年同日的氣候紀錄作為參考（API 回傳攝氏）
  let lowC: number | null = null
  let highC: number | null = null
  let condition: WeatherCondition = 'partly-cloudy'
  // 查不到資料時，概況文字沿用「多雲時晴」的中文標籤
  let conditionLabel: string = WEATHER_CONDITION_LABELS['partly-cloudy']

  try {
    const [y, m, day] = dateTrimmed.split('-')
    const lastYearDate = `${parseInt(y, 10) - 1}-${m}-${day}`
    const histUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${coord.lat}&longitude=${coord.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${lastYearDate}&end_date=${lastYearDate}`
    const histRes = await fetch(histUrl)
    if (histRes.ok) {
      const histData = await histRes.json()
      if (histData.daily) {
        lowC = histData.daily.temperature_2m_min?.[0] != null ? Math.round(histData.daily.temperature_2m_min[0]) : null
        highC = histData.daily.temperature_2m_max?.[0] != null ? Math.round(histData.daily.temperature_2m_max[0]) : null
        const mapped = mapWmoCode(histData.daily.weather_code?.[0] ?? 2)
        condition = mapped.condition
        conditionLabel = mapped.label
      }
    }
  } catch {
    // 忽略
  }

  const low = toUnit(lowC, tempUnit)
  const high = toUnit(highC, tempUnit)

  // 情況 3 無即時觀測資料，僅能提供預估值，因此保留「預估氣候」提示
  const summary = `${conditionLabel}（預估氣候，氣溫約 ${
    low ?? convertTemp(22, tempUnit)
  } °${tempUnit} ~ ${high ?? convertTemp(28, tempUnit)} °${tempUnit}）`

  return {
    weather: {
      tempUnit,
      low,
      high,
      condition,
      sunrise,
      sunset,
      summary,
    },
    locationName: coord.name,
    message: `已填入當日日出日落時間與預估氣溫（因日期超過 16 天，拍攝日接近時可再次點擊更新即時預報）`,
  }
}
