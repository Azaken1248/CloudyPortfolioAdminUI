import { useCallback, useRef, useState } from 'react'
import { CloudArrowUpIcon, ImageIcon, TrashIcon } from '@phosphor-icons/react'
import { handleDraftImage } from '../lib/draftImageHandler'
import './ImageUploader.css'

type ImageUploaderProps = {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return

      setProcessing(true)
      setProgress(30)

      try {
        setProgress(60)
        const dataUrl = await handleDraftImage(file)
        setProgress(100)
        onChange(dataUrl)
      } catch (err) {
        console.error('Image processing failed:', err)
      } finally {
        setTimeout(() => {
          setProcessing(false)
          setProgress(0)
        }, 300)
      }
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="image-uploader">
      {label && <label className="form-field-label">{label}</label>}

      {value ? (
        <div className="image-uploader-preview">
          <img src={value} alt="Uploaded" className="image-uploader-thumb" />
          <div className="image-uploader-preview-actions">
            <button
              type="button"
              className="image-uploader-change"
              onClick={() => inputRef.current?.click()}
            >
              <ImageIcon size={14} />
              Change
            </button>
            <button
              type="button"
              className="image-uploader-remove"
              onClick={() => onChange('')}
            >
              <TrashIcon size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-uploader-dropzone ${dragOver ? 'drag-over' : ''} ${processing ? 'uploading' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <CloudArrowUpIcon size={28} weight="light" />
          <span className="image-uploader-text">
            {processing ? 'Processing…' : 'Drop image or click to browse'}
          </span>
          {processing && (
            <div className="image-uploader-progress">
              <div
                className="image-uploader-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="visually-hidden"
      />
    </div>
  )
}
