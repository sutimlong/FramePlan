import { useState } from 'react'
import { CloudSun, Loader2 } from 'lucide-react'
import type { PlaceInfo, WeatherCondition } from '@shared/schema'
import { selectCurrentDay, useCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { Card, DateField, NumberField, SelectField, TextField, TimeField } from '../common/Fields'
import { SlateEditor } from '../editor/SlateEditor'
import { fetchWeatherForDay } from '@/lib/weatherService'

export const CONDITIONS: ReadonlyArray<{ value: WeatherCondition; label: string }> = [
  { value: 'sunny', label: '晴天' },
  { value: 'partly-cloudy', label: '多雲時晴' },
  { value: 'cloudy', label: '陰天' },
  { value: 'rain', label: '下雨' },
  { value: 'snow', label: '下雪' },
  { value: 'storm', label: '暴風雨' },
  { value: 'fog', label: '起霧' },
]

type PlaceKey = 'productionOffice' | 'nearestHospital' | 'parking' | 'basecamp' | 'mainShootLocation'

const PLACES: Array<{ key: PlaceKey; title: string }> = [
  { key: 'mainShootLocation', title: '主拍攝地' },
  { key: 'productionOffice', title: '製片辦公室' },
  { key: 'nearestHospital', title: '最近醫院' },
  { key: 'parking', title: '停車場' },
  { key: 'basecamp', title: '基地營' },
]

export function DayView() {
  const day = useCurrentDay()
  const setDay = useProjectStore((s) => s.setDay)
  const showToast = useProjectStore((s) => s.showToast)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const w = day.weather

  const setWeather = (p: Partial<typeof w>) =>
    useProjectStore.getState().patchDay((d) => ({
      ...d,
      weather: { ...d.weather, ...p },
    }))
  const setPlace = (k: PlaceKey, p: Partial<PlaceInfo>) =>
    useProjectStore.getState().patchDay((d) => ({
      ...d,
      locations: { ...d.locations, [k]: { ...d.locations[k], ...p } },
    }))

  const handleAutoFillWeather = async () => {
    const cur = selectCurrentDay(useProjectStore.getState())
    if (!cur.date) {
      showToast('error', '請先填寫上方的「拍攝日期」')
      return
    }
    setLoadingWeather(true)
    try {
      const loc =
        cur.locations.mainShootLocation?.address ||
        cur.locations.basecamp?.address ||
        cur.locations.productionOffice?.address ||
        ''
      const res = await fetchWeatherForDay(cur.date, loc)
      useProjectStore.getState().patchDay((d) => ({
        ...d,
        weather: {
          ...d.weather,
          ...res.weather,
        },
      }))
      showToast('info', res.message)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '取得天氣資料失敗')
    } finally {
      setLoadingWeather(false)
    }
  }

  return (
    <div className="view-grid">
      <Card title="本日資訊">
        <div className="grid g2">
          <DateField label="拍攝日期" value={day.date} onChange={(v) => setDay({ date: v })} />
          <TimeField label="總通告時間 (Crew Call)" value={day.crewCall} onChange={(v) => setDay({ crewCall: v })} />
          <TextField label="現場醫護" value={day.setMedic} onChange={(v) => setDay({ setMedic: v })} />
          <TextField label="排程版本" value={day.scheduleVersion} onChange={(v) => setDay({ scheduleVersion: v })} />
        </div>
        <TextField label="通告備註" value={day.generalCallNote ?? ''} onChange={(v) => setDay({ generalCallNote: v })} />
      </Card>

      <Card
        title="天氣"
        actions={
          <button
            type="button"
            className="btn small"
            onClick={handleAutoFillWeather}
            disabled={loadingWeather}
          >
            {loadingWeather ? <Loader2 size={13} className="spin" /> : <CloudSun size={13} />}
            {loadingWeather ? '取得中…' : '自動填入'}
          </button>
        }
      >
        <div className="grid g3">
          <SelectField
            label="溫度單位"
            value={w.tempUnit}
            options={[
              { value: 'C', label: '攝氏 °C' },
              { value: 'F', label: '華氏 °F' },
            ]}
            onChange={(v) => setWeather({ tempUnit: v })}
          />
          <NumberField label="最低溫" value={w.low} onChange={(v) => setWeather({ low: v })} />
          <NumberField label="最高溫" value={w.high} onChange={(v) => setWeather({ high: v })} />
          <SelectField label="天氣狀況" value={w.condition} options={CONDITIONS} onChange={(v) => setWeather({ condition: v })} />
          <TimeField label="日出" value={w.sunrise} onChange={(v) => setWeather({ sunrise: v })} />
          <TimeField label="日落" value={w.sunset} onChange={(v) => setWeather({ sunset: v })} />
        </div>
        <TextField label="天氣概況" value={w.summary} onChange={(v) => setWeather({ summary: v })} />
      </Card>

      <Card title="地點">
        <div className="grid g2">
          {PLACES.map(({ key, title }) => (
            <div className="place" key={key}>
              <h4>{title}</h4>
              <TextField placeholder="地址" value={day.locations[key].address} onChange={(v) => setPlace(key, { address: v })} />
              <TextField placeholder="備註" value={day.locations[key].notes ?? ''} onChange={(v) => setPlace(key, { notes: v })} />
            </div>
          ))}
        </div>
        <h4 className="sub">地點備註</h4>
        <SlateEditor
          value={day.locations.freeNotes}
          onChange={(v) => setDay({ locations: { ...day.locations, freeNotes: v } })}
          placeholder="停車、動線、注意事項…"
        />
      </Card>
    </div>
  )
}
