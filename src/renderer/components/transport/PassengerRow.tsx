import { X } from 'lucide-react'
import type { PassengerDetail } from '@shared/schema'
import type { Person } from '@/lib/transport'
import { TextField, TimeField } from '../common/Fields'

interface Props {
  index: number
  person: Person
  detail: PassengerDetail
  onChange: (p: Partial<PassengerDetail>) => void
  onRemove: () => void
}

/** 乘客一列：上車時間／上車地點／下車地點／備註，地點皆為自由填寫文字 */
export function PassengerRow({ index, person, detail: d, onChange, onRemove }: Props) {
  return (
    <div className={`passenger-row ${person.working ? '' : 'warn'}`}>
      <div className="passenger-name">
        <span className="seat-no">{index + 1}</span>
        <div>
          <strong>{person.name}</strong>
          <div className="muted">
            {person.kind === 'cast' ? '演員' : '工作人員'} {person.sub}
            {!person.working && ' ・本日不出勤'}
          </div>
        </div>
      </div>
      <TimeField label="上車時間" compact value={d.boardTime} onChange={(x) => onChange({ boardTime: x })} />
      <TextField label="上車地點" placeholder="例：飯店大廳" value={d.boardPlace} onChange={(x) => onChange({ boardPlace: x })} />
      <TextField label="下車地點" placeholder="例：基地營" value={d.alightPlace} onChange={(x) => onChange({ alightPlace: x })} />
      <TextField label="備註" value={d.note} onChange={(x) => onChange({ note: x })} />
      <button className="icon-btn" title="移出乘車名單" onClick={onRemove}>
        <X size={14} />
      </button>
    </div>
  )
}
