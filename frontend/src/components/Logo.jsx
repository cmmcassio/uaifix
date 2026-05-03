export default function Logo({ size = 'md', showTagline = true }) {
  const dim = { sm: 52, md: 72, lg: 88 }[size] ?? 72

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src="https://res.cloudinary.com/dc6qgtjvq/image/upload/v1777840836/ChatGPT_Image_3_de_mai._de_2026_16_37_36_osvdhg.png"
        alt="UaiFix logo"
        width={dim}
        height={dim}
        style={{ borderRadius: '50%' }}
      />
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