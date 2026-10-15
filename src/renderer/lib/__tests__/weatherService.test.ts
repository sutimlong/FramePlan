import { afterEach, describe, expect, it, vi } from 'vitest'
import { WEATHER_CONDITION_LABELS } from '@shared/schema'
import { buildWeatherSummary, fetchWeatherForDay, mapWmoCode, toCompass } from '@/lib/weatherService'

/** 概況文字必須全中文：不得出現任何英文字母 */
const expectNoLatin = (text: string) => {
  expect(text).not.toMatch(/[A-Za-z]/)
}

describe('buildWeatherSummary', () => {
  it('資料齊全時組出中文概況（含風速與中文風向）', () => {
    const text = buildWeatherSummary({
      condition: 'rain',
      label: '陣雨',
      rainChance: 60,
      sunshineChance: 10,
      windSpeed: 12,
      windDir: '東南東',
    })

    expect(text).toBe('陣雨，降雨機率 60%，日照機率 10%。風速 12 公里/小時 東南東')
    expectNoLatin(text)
  })

  it('歷史資料沒有降雨機率時自動略過該段', () => {
    const text = buildWeatherSummary({
      condition: 'sunny',
      label: '晴天',
      sunshineChance: 98,
      windSpeed: 5,
      windDir: '東南東',
    })

    expect(text).toBe('晴天，日照機率 98%。風速 5 公里/小時 東南東')
    expect(text).not.toContain('降雨機率')
    expectNoLatin(text)
  })

  it('缺少風速或風向時略過風的資訊', () => {
    expect(buildWeatherSummary({ condition: 'cloudy', label: '陰天' })).toBe('陰天。')
    expect(buildWeatherSummary({ condition: 'cloudy', label: '陰天', windSpeed: 8 })).toBe('陰天。')
    expect(buildWeatherSummary({ condition: 'cloudy', label: '陰天', windDir: '北' })).toBe('陰天。')
  })

  it('風速為 0 仍算有效資料（0 不等於沒有資料）', () => {
    expect(buildWeatherSummary({ condition: 'fog', label: '起霧', windSpeed: 0, windDir: '北' })).toBe(
      '起霧。風速 0 公里/小時 北',
    )
  })

  it('未提供細分標籤時，退回天氣狀況的一般中文名稱', () => {
    expect(buildWeatherSummary({ condition: 'rain' })).toBe(`${WEATHER_CONDITION_LABELS.rain}。`)
    expect(buildWeatherSummary({ condition: 'storm' })).toBe('暴風雨。')
    // 只有空白字元的標籤視為沒有標籤
    expect(buildWeatherSummary({ condition: 'snow', label: '   ' })).toBe('下雪。')
  })

  it('mapWmoCode 的所有標籤都能組出不含英文的概況', () => {
    const codes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99, 999]

    for (const code of codes) {
      const { condition, label } = mapWmoCode(code)
      const text = buildWeatherSummary({
        condition,
        label,
        rainChance: 30,
        sunshineChance: 40,
        windSpeed: 7,
        windDir: '西南西',
      })

      expectNoLatin(text)
      expect(text.startsWith(`${label}，降雨機率 30%`)).toBe(true)
    }
  })
})

describe('toCompass（風向角度 → 中文方位）', () => {
  it('對應 16 方位的中文名稱', () => {
    expect(toCompass(0)).toBe('北')
    expect(toCompass(22.5)).toBe('北北東')
    expect(toCompass(45)).toBe('東北')
    expect(toCompass(90)).toBe('東')
    expect(toCompass(121)).toBe('東南東')
    expect(toCompass(180)).toBe('南')
    expect(toCompass(225)).toBe('西南')
    expect(toCompass(270)).toBe('西')
    expect(toCompass(315)).toBe('西北')
    expect(toCompass(337.5)).toBe('北北西')
    // 348.75° 之後視為北方（16 方位每一格 22.5°）
    expect(toCompass(348.75)).toBe('北')
  })

  it('超過 360° 或負角度會先正規化', () => {
    expect(toCompass(360)).toBe('北')
    expect(toCompass(450)).toBe('東')
    expect(toCompass(-90)).toBe('西')
  })

  it('沒有角度資料時回傳空字串', () => {
    expect(toCompass(null)).toBe('')
    expect(toCompass(undefined)).toBe('')
    expect(toCompass(Number.NaN)).toBe('')
  })
})

describe('fetchWeatherForDay（拍攝地點 → 查詢地區）', () => {
  /** 台北市的預設座標：只有在完全沒有可解析的地點時才會用到 */
  const TAIPEI_LAT = '25.0375'
  const TAIPEI_LNG = '121.5637'

  /** 3 天後的日期必定落在 Open-Meteo 數值預報範圍內（-90 ~ +16 天） */
  const forecastDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  }

  /** 假的 Open-Meteo 每日預報回應 */
  const forecastResponse = (date: string) => ({
    ok: true,
    status: 200,
    json: async () => ({
      daily: {
        time: [date],
        weather_code: [2],
        temperature_2m_max: [30],
        temperature_2m_min: [22],
        sunrise: [`${date}T05:30`],
        sunset: [`${date}T18:10`],
        precipitation_probability_max: [40],
        sunshine_duration: [21600],
        daylight_duration: [43200],
        wind_speed_10m_max: [10],
        wind_direction_10m_dominant: [90],
      },
    }),
  })

  /** 攔截 fetch 並記錄所有請求網址，方便斷言實際查詢的經緯度 */
  const stubFetch = (geocodeResult?: unknown) => {
    const urls: string[] = []
    vi.stubGlobal('fetch', async (input: unknown) => {
      const url = String(input)
      urls.push(url)
      if (url.includes('nominatim')) {
        return { ok: true, status: 200, json: async () => geocodeResult ?? [] }
      }
      return forecastResponse(forecastDate())
    })
    return urls
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('主拍攝地點填台北以外地區時，直接套用該地區天氣', async () => {
    const date = forecastDate()
    const urls = stubFetch()

    const res = await fetchWeatherForDay(date, '高雄市前鎮區')

    expect(res.locationName).toBe('高雄市')
    expect(res.message).toContain('高雄市')
    expect(urls[0]).toContain('latitude=22.6273')
    expect(urls[0]).toContain('longitude=120.3014')
    // 不可退回預設的台北座標
    expect(urls[0]).not.toContain(TAIPEI_LAT)
    expect(urls[0]).not.toContain(TAIPEI_LNG)
  })

  it('「臺」與「台」寫法都能對應到同一個地區', async () => {
    const urls = stubFetch()

    const res = await fetchWeatherForDay(forecastDate(), '臺中市西屯區')

    expect(res.locationName).toBe('台中市')
    expect(urls[0]).toContain('latitude=24.1627')
    expect(urls[0]).not.toContain(TAIPEI_LAT)
  })

  it('地址沒有縣市關鍵字時走線上地理編碼，仍不使用預設台北', async () => {
    const urls = stubFetch([{ lat: '25.0330', lon: '121.5654' }])

    const res = await fetchWeatherForDay(forecastDate(), '信義區松壽路')

    expect(urls[0]).toContain('nominatim.openstreetmap.org/search?q=')
    expect(urls[0]).toContain(encodeURIComponent('信義區松壽路'))
    expect(urls[1]).toContain('latitude=25.033')
    expect(urls[1]).toContain('longitude=121.5654')
    expect(urls[1]).not.toContain(TAIPEI_LAT)
    expect(res.locationName).toBe('信義區松壽路')
  })

  it('完全沒有填寫地點時，才使用預設台北', async () => {
    const urls = stubFetch()

    const res = await fetchWeatherForDay(forecastDate(), '')

    expect(res.locationName).toBe('台北市')
    expect(urls[0]).toContain(`latitude=${TAIPEI_LAT}`)
    expect(urls[0]).toContain(`longitude=${TAIPEI_LNG}`)
    // 沒有地點時不需呼叫地理編碼
    expect(urls.some((u) => u.includes('nominatim'))).toBe(false)
  })

  it('地址查不到縣市且線上地理編碼失敗時，退回預設台北（已知限制）', async () => {
    const urls = stubFetch()

    const res = await fetchWeatherForDay(forecastDate(), '某個不知名的農場')

    expect(res.locationName).toBe('台北市')
    expect(urls[0]).toContain('nominatim')
    expect(urls[1]).toContain(`latitude=${TAIPEI_LAT}`)
  })
})

