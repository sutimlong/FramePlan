import { selectCurrentDay, useProjectStore } from '@/store/useProjectStore'
import { DayPageOne } from './DayPageOne'
import { DayPageTwo } from './DayPageTwo'

export function CallsheetPrintView() {
  const doc = useProjectStore((s) => s.doc)
  const scope = useProjectStore((s) => s.printScope)
  const current = useProjectStore(selectCurrentDay)

  const list = scope === 'all' ? doc.days : [current]

  return (
    <div id="print-root" className="print-root">
      {list.map((day) => {
        const index = doc.days.findIndex((d) => d.id === day.id)
        return (
          <div key={day.id} className="cs-day">
            <DayPageOne doc={doc} day={day} index={index} />
            <DayPageTwo doc={doc} day={day} index={index} />
          </div>
        )
      })}
    </div>
  )
}
