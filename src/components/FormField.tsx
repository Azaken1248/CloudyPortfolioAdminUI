import { useId, type ReactNode } from 'react'
import './FormField.css'

type DiffStatus = 'modified' | 'added' | 'removed' | undefined

type FormFieldProps = {
  label: string
  id?: string
  helper?: string
  error?: string
  required?: boolean
  diff?: DiffStatus
  children: ReactNode
}

export function FormField({
  label,
  id,
  helper,
  error,
  required,
  diff,
  children,
}: FormFieldProps) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''} ${diff ? `diff-${diff}` : ''}`}>
      <label className="form-field-label" htmlFor={id}>
        {label}
        {required && <span className="form-field-required">*</span>}
        {diff && <span className={`diff-badge diff-badge-${diff}`}>{diff}</span>}
      </label>
      {children}
      {helper && !error && <p className="form-field-helper">{helper}</p>}
      {error && <p className="form-field-error">{error}</p>}
    </div>
  )
}

type TextInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  error?: string
  required?: boolean
  type?: 'text' | 'email' | 'url'
  disabled?: boolean
  diff?: DiffStatus
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  required,
  type = 'text',
  disabled,
  diff,
}: TextInputProps) {
  const inputId = useId()

  return (
    <FormField label={label} id={inputId} helper={helper} error={error} required={required} diff={diff}>
      <input
        id={inputId}
        type={type}
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FormField>
  )
}

type TextAreaInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  error?: string
  required?: boolean
  rows?: number
  disabled?: boolean
  diff?: DiffStatus
}

export function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  required,
  rows = 3,
  disabled,
  diff,
}: TextAreaInputProps) {
  const inputId = useId()

  return (
    <FormField label={label} id={inputId} helper={helper} error={error} required={required} diff={diff}>
      <textarea
        id={inputId}
        className="form-input form-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
    </FormField>
  )
}

type SelectInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  helper?: string
  error?: string
  required?: boolean
  diff?: DiffStatus
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  helper,
  error,
  required,
  diff,
}: SelectInputProps) {
  const inputId = useId()

  return (
    <FormField label={label} id={inputId} helper={helper} error={error} required={required} diff={diff}>
      <select
        id={inputId}
        className="form-input form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
