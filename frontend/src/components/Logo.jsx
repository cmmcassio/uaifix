export default function Logo({ size = 'md', showTagline = true }) {
  const dim = { sm: 40, md: 52, lg: 64 }[size] ?? 52
  const textSize = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size] ?? 'text-2xl'
  const G = '#C9A84C'

  return (
    <div className="flex flex-col items-center gap-2">
      {/*
        viewBox 0 0 64 64 — circle cx=32 cy=32 r=28

        Chave de fenda (rotate -45°, NW→SE):
          · Cabo oval: ellipse cx=32 cy=13 rx=7 ry=5
          · Haste: linha vertical x=32, y=18→48
          · Taper: de (32,48) para (27.5,52) e (36.5,52)
          · Ponta flat-head: linha horizontal y=52, x=27.5→36.5

        Chave de boca (rotate +45°, NE→SW):
          · Contorno externo: jaw aberto no topo, afunila para cabo retangular
            M 24 10 → baixo até y=24, taper para y=27, cabo até y=54, volta
          · Jaw interior: braço esq (x=29, y=10→21), braço dir (x=35, y=10→21)
          · Fundo do U: linha y=21, x=29→35

        Todos os pontos verificados: distância do centro ≤ 28.
      */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="28" stroke={G} strokeWidth="2.5" />

        {/* Chave de fenda — cabo oval, haste, ponta flat-head — rotada -45° (NW→SE) */}
        <g transform="rotate(-45, 32, 32)">
          {/* Cabo oval */}
          <ellipse cx="32" cy="13" rx="7" ry="5" stroke={G} strokeWidth="2" fill="none" />
          {/* Haste */}
          <line x1="32" y1="18" x2="32" y2="48" stroke={G} strokeWidth="2" strokeLinecap="round" />
          {/* Taper esquerdo */}
          <line x1="32" y1="48" x2="27.5" y2="52" stroke={G} strokeWidth="1.5" strokeLinecap="round" />
          {/* Taper direito */}
          <line x1="32" y1="48" x2="36.5" y2="52" stroke={G} strokeWidth="1.5" strokeLinecap="round" />
          {/* Ponta flat-head */}
          <line x1="27.5" y1="52" x2="36.5" y2="52" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Chave de boca — jaw em U aberto, cabo retangular — rotada +45° (NE→SW) */}
        <g transform="rotate(45, 32, 32)">
          {/* Contorno externo: jaw + transição afunilada + cabo */}
          <path
            d="M 24 10 L 24 24 L 27 27 L 27 54 L 37 54 L 37 27 L 40 24 L 40 10"
            stroke={G}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Braço interno esquerdo do jaw */}
          <line x1="29" y1="10" x2="29" y2="21" stroke={G} strokeWidth="2" strokeLinecap="round" />
          {/* Braço interno direito do jaw */}
          <line x1="35" y1="10" x2="35" y2="21" stroke={G} strokeWidth="2" strokeLinecap="round" />
          {/* Fundo do jaw (forma o U) */}
          <line x1="29" y1="21" x2="35" y2="21" stroke={G} strokeWidth="2" strokeLinecap="round" />
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
