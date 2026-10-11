import { Plus, Trash2 } from 'lucide-react'
import type { PlaceInfo, WeatherCondition } from '@shared/schema'
import { useSchedStore } from '@/store/useSchedStore'
import { Card, DateField, NumberField, SelectField, TextField, TimeField } from '../common/Fields'
import { SlateEditor } from '../editor/SlateEditor'

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

export function GeneralView() {
  const doc = useSchedStore((s) => s.doc)
  const patch = useSchedStore((s) => s.patch)
  const store = useSchedStore.getState
  const g = doc.general
  const w = doc.weather

  const setGeneral = (p: Partial<typeof g>) => patch((d) => ({ ...d, general: { ...d.general, ...p } }))
  const setWeather = (p: Partial<typeof w>) => patch((d) => ({ ...d, weather: { ...d.weather, ...p } }))
  const setPlace = (k: PlaceKey, p: Partial<PlaceInfo>) =>
    patch((d) => ({ ...d, locations: { ...d.locations, [k]: { ...d.locations[k], ...p } } }))

  return (
    <div className="view-grid">
      <Card title="基本資訊">
        <div className="grid g2">
          <TextField label="專案名稱" value={g.projectName} onChange={(v) => setGeneral({ projectName: v })} />
          <TextField label="公司名稱" value={g.companyName} onChange={(v) => setGeneral({ companyName: v })} />
          <DateField label="拍攝日期" value={g.shootDate} onChange={(v) => setGeneral({ shootDate: v })} />
          <TimeField label="總通告時間 (Crew Call)" value={g.crewCall} onChange={(v) => setGeneral({ crewCall: v })} />
          <NumberField
            label="拍攝天數（第幾天）"
            min={1}
            value={g.dayNumber}
            onChange={(v) => setGeneral({ dayNumber: v ?? 1 })}
          />
          <NumberField
            label="總拍攝天數"
            min={1}
            value={g.totalDays}
            onChange={(v) => setGeneral({ totalDays: v ?? 1 })}
          />
          <TextField label="劇本版本" value={g.scriptVersion} onChange={(v) => setGeneral({ scriptVersion: v })} />
          <TextField label="排程版本" value={g.scheduleVersion} onChange={(v) => setGeneral({ scheduleVersion: v })} />
          <TextField label="現場醫護" value={g.setMedic} onChange={(v) => setGeneral({ setMedic: v })} />
          <TextField
            label="通告備註"
            value={g.generalCallNote ?? ''}
            onChange={(v) => setGeneral({ generalCallNote: v })}
          />
        </div>
      </Card>

      <Card
        title="主要人員 (Key People)"
        actions={
          <button className="btn small" onClick={() => store().addKeyPerson()}>
            <Plus size={14} /> 新增
          </button>
        }
      >
        {g.keyPeople.length === 0 && <p className="muted">尚未新增主要人員</p>}
        {g.keyPeople.map((k) => (
          <div className="row-inline" key={k.id}>
            <TextField placeholder="職稱（導演、製片…）" value={k.title} onChange={(v) => store().updateKeyPerson(k.id, { title: v })} />
            <TextField placeholder="姓名" value={k.name} onChange={(v) => store().updateKeyPerson(k.id, { name: v })} />
            <TextField placeholder="電話" value={k.phone ?? ''} onChange={(v) => store().updateKeyPerson(k.id, { phone: v })} />
            <button className="icon-btn danger" onClick={() => store().removeKeyPerson(k.id)} aria-label="刪除">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Card>

      <Card title="天氣">
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
              <TextField placeholder="地址" value={doc.locations[key].address} onChange={(v) => setPlace(key, { address: v })} />
              <TextField placeholder="備註" value={doc.locations[key].notes ?? ''} onChange={(v) => setPlace(key, { notes: v })} />
            </div>
          ))}
        </div>
        <h4 className="sub">地點備註</h4>
        <SlateEditor
          value={doc.locations.freeNotes}
          onChange={(v) => patch((d) => ({ ...d, locations: { ...d.locations, freeNotes: v } }))}
          placeholder="停車、動線、注意事項…"
        />
      </Card>
    </div>
  )
}
