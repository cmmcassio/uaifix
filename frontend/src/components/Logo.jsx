export default function Logo({ size = 'md', showTagline = true }) {
  const dim = { sm: 40, md: 52, lg: 64 }[size] ?? 52
  const textSize = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size] ?? 'text-2xl'
  const G = '#C9A84C'

  return (
    <div className="flex flex-col items-center gap-2">
      {/*
        viewBox 0 0 64 64 — circle cx=32 cy=32 r=28
        Screwdriver: designed vertically, rotated -45° → aponta NW→SE
          · T-head crossbar horizontal no topo (y=12)
          · Shaft vertical (x=32, de y=12 até y=52)
          · Flat-head tip horizontal na ponta (y=52)
        Wrench: designed vertically, rotated +45° → aponta NE→SW
          · Jaw aberto no topo — dois braços paralelos (x=24 e x=40, de y=10 até y=22)
          · Transição para o cabo (afunila de 16px para 10px de largura)
          · Cabo retangular de y=22 até y=54
        Todos os pontos ficam dentro de r=28 (verificado geometricamente).
      */}
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
          {/* Cabeça em T: barra horizontal */}
          <line x1="22" y1="12" x2="42" y2="12" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
          {/* Haste vertical */}
          <line x1="32" y1="12" x2="32" y2="52" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
          {/* Ponta plana (flat-head) */}
          <line x1="26" y1="52" x2="38" y2="52" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Chave de boca — rotada +45° (NE → SW) */}
        <g transform="rotate(45, 32, 32)">
          {/*
            Perfil da chave: jaw aberto no topo, cabo embaixo.
            Braço esquerdo: (24,10)→(24,22), depois afunila para (27,22)
            Cabo esquerdo: (27,22)→(27,54)
            Fundo do cabo: (27,54)→(37,54)
            Cabo direito: (37,54)→(37,22)
            Afunila direito: (37,22)→(40,22)
            Braço direito: (40,22)→(40,10)
          */}
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
          <span style={{ color: '#F0EDE4' }}>ai</span>
          <span style={{ color: '#C9A84C' }}>F</span>
          <span style={{ color: '#F0EDE4' }}>ix</span>
        </span>
        {showTagline && (
          <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: 'rgba(240,237,228,0.38)' }}>
            Assistência técnica de confiança
          </p>
        )}
      </div>
    </div>
  )
}
