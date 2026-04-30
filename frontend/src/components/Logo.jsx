export default function Logo({ size = 'md', showTagline = true }) {
  const dim = { sm: 52, md: 72, lg: 88 }[size] ?? 72
  const textSize = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size] ?? 'text-2xl'
  const G = '#C9A84C'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="28" stroke={G} strokeWidth="2.5" />

        {/* Chave de fenda — rotada -45° (NW → SE) */}
        <g transform="rotate(-45, 32, 32)">
          <line x1="22" y1="12" x2="42" y2="12" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="52" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="26" y1="52" x2="38" y2="52" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Chave de boca — rotada +45° (NE → SW) */}
        <g transform="rotate(45, 32, 32)">
          <path
            d="M 24 10 L 24 22 L 27 22 L 27 54 L 37 54 L 37 22 L 40 22 L 40 10"
            stroke={G}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div className="text-center">
        <span className={`${textSize} font-bold leading-none`}>
          <span style={{ color: '#C9A84C' }}>U</span>
          <span style={{ color: '#2C2416' }}>ai</span>
          <span style={{ color: '#C9A84C' }}>F</span>
          <span style={{ color: '#2C2416' }}>ix</span>
        </span>
        {showTagline && (
          <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: 'rgba(44,36,22,0.5)' }}>
            Assistência técnica de confiança
          </p>
        )}
      </div>
    </div>
  )
}
