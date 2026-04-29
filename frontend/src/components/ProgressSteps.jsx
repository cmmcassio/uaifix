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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done
                    ? 'bg-primary-700 text-white'
                    : active
                    ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium hidden sm:block ${
                  active ? 'text-primary-700' : done ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-primary-700' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
