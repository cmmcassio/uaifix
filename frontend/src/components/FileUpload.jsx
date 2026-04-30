import { useRef, useState } from 'react'

export default function FileUpload({ label, hint, accept = 'image/*', value, onChange, required }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB.')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(file)
  }

  const handleChange = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div>
      <label className="form-label">
        {label} {required && <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>}
      </label>
      {hint && <p className="text-xs text-cream/40 mb-2">{hint}</p>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="relative rounded-xl p-4 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragOver ? '#C9A84C' : value ? 'rgba(74,222,128,0.5)' : 'rgba(201,168,76,0.25)'}`,
          background: dragOver
            ? 'rgba(201,168,76,0.06)'
            : value
            ? 'rgba(74,222,128,0.05)'
            : 'rgba(13,17,23,0.3)',
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" className="mx-auto max-h-32 rounded-lg object-cover" />
        ) : (
          <div className="py-4">
            <svg className="mx-auto h-10 w-10 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-2 text-sm text-cream/60">
              <span className="font-semibold text-gold">Clique para selecionar</span> ou arraste aqui
            </p>
            <p className="text-xs text-cream/30 mt-1">JPG, PNG ou WebP — máximo 5MB</p>
          </div>
        )}
        {value && (
          <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium" style={{ color: '#4ADE80' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {value.name}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  )
}
