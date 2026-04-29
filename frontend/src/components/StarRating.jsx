export default function StarRating({ value, onChange, disabled = false, size = 'md' }) {
  const sz = size === 'lg' ? 'text-4xl' : 'text-3xl'
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onChange(n)}
          className={`${sz} leading-none transition-transform ${
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${n <= value ? 'text-yellow-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
