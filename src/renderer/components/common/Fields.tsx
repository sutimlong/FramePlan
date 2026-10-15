import type { ReactNode } from 'react'

interface TextProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  onEnter?: () => void
}

export function TextField({ label, value, onChange, placeholder, className, onEnter }: TextProps) {
  return (
    <label className={`field ${className ?? ''}`}>
      {label && <span className="field-label">{label}</span>}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.()
        }}
      />
    </label>
  )
}

interface NumProps {
  label?: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  min?: number
}

export function NumberField({ label, value, onChange, placeholder, min }: NumProps) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <input
        type="number"
        min={min}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </label>
  )
}

interface TimeProps {
  label?: string
  value: string
  onChange: (v: string) => void
  compact?: boolean
}

export function TimeField({ label, value, onChange, compact }: TimeProps) {
  return (
    <label className={`field ${compact ? 'compact' : ''}`}>
      {label && <span className="field-label">{label}</span>}
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function DateField({ label, value, onChange }: TimeProps) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export interface SelectGroup<T extends string = string> {
  group: string
  options: ReadonlyArray<SelectOption<T>>
}

interface SelectProps<T extends string> {
  label?: string
  value: T
  options?: ReadonlyArray<SelectOption<T>>
  groups?: ReadonlyArray<SelectGroup<T>>
  placeholder?: string
  className?: string
  onChange: (v: T) => void
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  groups,
  placeholder,
  className,
  onChange,
}: SelectProps<T>) {
  const isKnownValue =
    options?.some((o) => o.value === value) ||
    groups?.some((g) => g.options.some((o) => o.value === value))

  return (
    <label className={`field ${className ?? ''}`}>
      {label && <span className="field-label">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups?.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
        {value && !isKnownValue && (
          <option value={value}>{value}</option>
        )}
      </select>
    </label>
  )
}

export function Card({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>{title}</h2>
        <div className="card-actions">{actions}</div>
      </header>
      <div className="card-body">{children}</div>
    </section>
  )
}
