import { describe, expect, it } from 'vitest'
import { WEATHER_CONDITION_LABELS } from '@shared/schema'
import { buildWeatherSummary, mapWmoCode, toCompass } from '@/lib/weatherService'

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
