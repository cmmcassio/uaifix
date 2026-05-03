export default function Logo({ size = 'md', showTagline = true }) {
  const dim = { sm: 52, md: 72, lg: 88 }[size] ?? 72

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFE566" />
            <stop offset="60%"  stopColor="#D4A017" />
            <stop offset="100%" stopColor="#8B6000" />
          </radialGradient>
          <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3"
              floodColor="#8B6000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Medalha dourada — gradiente radial + sombra */}
        <circle cx="40" cy="40" r="36" fill="url(#goldGradient)" filter="url(#shadow)" />
        {/* Borda */}
        <circle cx="40" cy="40" r="36" stroke="#8B6000" strokeWidth="2" fill="none" />

        {/* Chave de fenda — rotada -45° (NW→SE), centro (40,40)
            Coordenadas escaladas 1.25× em relação ao viewBox original 64×64 */}
        <g transform="rotate(-45, 40, 40)">
          <line x1="27.5" y1="15"  x2="52.5" y2="15"  stroke="#5C3D00" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="40"   y1="15"  x2="40"   y2="65"  stroke="#5C3D00" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="32.5" y1="65"  x2="47.5" y2="65"  stroke="#5C3D00" strokeWidth="3.5" strokeLinecap="round" />
        </g>

        {/* Chave de boca — rotada +45° (NE→SW), centro (40,40) */}
        <g transform="rotate(45, 40, 40)">
          <path
            d="M 30 12.5 L 30 27.5 L 33.75 27.5 L 33.75 67.5 L 46.25 67.5 L 46.25 27.5 L 50 27.5 L 50 12.5"
            stroke="#5C3D00"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>

      <div className="text-center">
        <span className="text-3xl font-bold leading-none" style={{ color: '#2D5016' }}>
          UaiFix
        </span>
        {showTagline && (
          <p className="text-xs mt-0.5 tracking-wide" style={{ color: '#888888' }}>
            Assistência técnica de confiança
          </p>
        )}
      </div>
    </div>
  )
}
