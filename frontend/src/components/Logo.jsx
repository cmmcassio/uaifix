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
          {/* Gradiente da medalha dourada */}
          <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFE566" />
            <stop offset="60%"  stopColor="#D4A017" />
            <stop offset="100%" stopColor="#8B6000" />
          </radialGradient>

          {/* Gradiente das ferramentas — luz vindo do canto superior esquerdo */}
          <linearGradient id="toolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#D4930A" />
            <stop offset="100%" stopColor="#6B3D00" />
          </linearGradient>

          {/* Sombra da medalha */}
          <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3"
              floodColor="#8B6000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* ── Medalha dourada ───────────────────────────────────────────── */}
        <circle cx="40" cy="40" r="36" fill="url(#goldGradient)" filter="url(#shadow)" />
        <circle cx="40" cy="40" r="36" stroke="#8B6000" strokeWidth="2" fill="none" />

        {/* ── Chave de fenda ── rotada -45° (NW → SE), centro (40,40) ─── */}
        <g transform="rotate(-45, 40, 40)">
          {/* Cabo arredondado */}
          <rect x="32" y="8" width="16" height="19" rx="5"
            fill="url(#toolGradient)" stroke="#5C3D00" strokeWidth="1" />
          {/* Friso/reforço (ferrule) */}
          <rect x="36" y="27" width="8" height="5" rx="1"
            fill="#8B6000" stroke="#5C3D00" strokeWidth="0.8" />
          {/* Haste */}
          <rect x="38.5" y="32" width="3" height="27"
            fill="#8B6000" stroke="#5C3D00" strokeWidth="0.5" />
          {/* Ponta flat-head (trapézio achatado) */}
          <path d="M 38.5 59 L 34 67 L 46 67 L 41.5 59 Z"
            fill="#5C3D00" stroke="#5C3D00" strokeWidth="0.5" />
        </g>

        {/* ── Chave de boca ── rotada +45° (NE → SW), centro (40,40) ──── */}
        <g transform="rotate(45, 40, 40)">
          {/* Cabeça da chave: forma preenchida com abertura em U no topo
              M(30,10)→ top-left, travessa topo, desce lado direito externo,
              entra no jaw, sobe parede interna direita, arco U,
              desce parede interna esquerda, fecha */}
          <path
            d="M 30 10 L 50 10 L 50 28 L 44 28 L 44 22
               A 4 4 0 0 1 36 22 L 36 28 L 30 28 Z"
            fill="url(#toolGradient)" stroke="#5C3D00" strokeWidth="1" />
          {/* Cabo retangular arredondado */}
          <rect x="35" y="25" width="10" height="43" rx="3"
            fill="url(#toolGradient)" stroke="#5C3D00" strokeWidth="1" />
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
