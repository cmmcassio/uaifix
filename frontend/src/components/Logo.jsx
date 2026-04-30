export default function Logo({ size = 'md', showTagline = true }) {
  const dim = { sm: 40, md: 52, lg: 64 }[size] ?? 52
  const textSize = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size] ?? 'text-2xl'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={dim} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="26" cy="26" r="24" stroke="#C9A84C" strokeWidth="2"/>

        {/* Screwdriver — NW to SE direction */}
        {/* Handle at NW: thick stroke suggesting grip */}
        <line x1="10" y1="10" x2="16" y2="16" stroke="#C9A84C" strokeWidth="5" strokeLinecap="round"/>
        {/* Shaft: thinner middle section */}
        <line x1="16" y1="16" x2="33" y2="33" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
        {/* Flat-head tip at SE: perpendicular slash */}
        <line x1="31" y1="37" x2="37" y2="31" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round"/>

        {/* Wrench — NE to SW direction */}
        {/* Open-end wrench head at NE */}
        <path d="M38 9 C41 9 43.5 11.5 43.5 14.5 C43.5 17.5 41 20 38 20" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <line x1="38" y1="9" x2="38" y2="20" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
        {/* Handle going to SW */}
        <line x1="36" y1="19" x2="15" y2="40" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round"/>
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
