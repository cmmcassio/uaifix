export default function ProgressSteps({ steps, current }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  background: done || active ? '#C9A84C' : 'rgba(240,237,228,0.08)',
                  color: done || active ? '#0D1117' : 'rgba(240,237,228,0.35)',
                  boxShadow: active ? '0 0 0 3px rgba(201,168,76,0.2)' : 'none',
                }}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step}
              </div>
              <span
                className="mt-1 text-xs font-medium hidden sm:block"
                style={{
                  color: active ? '#C9A84C' : done ? 'rgba(201,168,76,0.6)' : 'rgba(240,237,228,0.3)',
                }}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 transition-all"
                style={{ background: done ? '#C9A84C' : 'rgba(240,237,228,0.1)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
