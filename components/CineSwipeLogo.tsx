interface CineSwipeLogoProps {
  size?: number;
  className?: string;
  idPrefix?: string;
}

export function CineSwipeLogo({
  size = 28,
  className = "",
  idPrefix = "csl",
}: CineSwipeLogoProps) {
  const bgId = `${idPrefix}-bg`;
  const rimId = `${idPrefix}-rim`;
  const goldId = `${idPrefix}-gold`;
  const roseId = `${idPrefix}-rose`;
  const shadowId = `${idPrefix}-shadow`;
  const glowId = `${idPrefix}-glow`;
  const frontClipId = `${idPrefix}-front-clip`;
  const backClipId = `${idPrefix}-back-clip`;
  const squircleClipId = `${idPrefix}-squircle-clip`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#161722" />
          <stop offset="50%" stopColor="#0C0D14" />
          <stop offset="100%" stopColor="#06070A" />
        </linearGradient>

        <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C518" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#F43F5E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F5C518" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id={roseId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="40%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>

        <filter id={shadowId} x="-25%" y="-20%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="14"
            stdDeviation="16"
            floodColor="#000000"
            floodOpacity="0.75"
          />
        </filter>

        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="30" result="blur" />
        </filter>

        <clipPath id={squircleClipId}>
          <rect x="0" y="0" width="512" height="512" rx="128" />
        </clipPath>

        <clipPath id={frontClipId}>
          <rect x="0" y="0" width="224" height="304" rx="38" />
        </clipPath>

        <clipPath id={backClipId}>
          <rect x="0" y="0" width="224" height="304" rx="38" />
        </clipPath>
      </defs>

      {/* EVERYTHING clipped inside squircle to prevent any bleed */}
      <g clipPath={`url(#${squircleClipId})`}>
        <rect width="512" height="512" fill={`url(#${bgId})`} />

        {/* Cinema Ambient Glows */}
        <circle
          cx="280"
          cy="230"
          r="140"
          fill="#F43F5E"
          opacity="0.28"
          filter={`url(#${glowId})`}
        />
        <circle
          cx="180"
          cy="290"
          r="130"
        fill="#F5C518"
        opacity="0.22"
        filter={`url(#${glowId})`}
      />

      {/* BACK CARD: Tilted Left (Gold Cinema Ticket / Reel Pass) */}
      <g
        transform="matrix(0.9659 -0.2588 0.2588 0.9659 -45 82)"
        filter={`url(#${shadowId})`}
      >
        <g transform="translate(132 104)">
          <g clipPath={`url(#${backClipId})`}>
            <rect x="0" y="0" width="224" height="304" fill="#241B08" />
            <g fill="#F5C518" opacity="0.95">
              <rect x="14" y="38" width="16" height="26" rx="6" />
              <rect x="14" y="86" width="16" height="26" rx="6" />
              <rect x="14" y="134" width="16" height="26" rx="6" />
              <rect x="14" y="182" width="16" height="26" rx="6" />
              <rect x="14" y="230" width="16" height="26" rx="6" />
            </g>
            <rect
              x="46"
              y="38"
              width="158"
              height="226"
              rx="22"
              fill="#171104"
              stroke="#F5C518"
              strokeWidth="3"
              strokeOpacity="0.4"
              strokeDasharray="8 5"
            />
            <circle
              cx="125"
              cy="151"
              r="38"
              fill="none"
              stroke={`url(#${goldId})`}
              strokeWidth="6"
              opacity="0.8"
            />
            <circle cx="125" cy="151" r="14" fill={`url(#${goldId})`} />
            <circle cx="125" cy="123" r="5" fill="#FDE047" />
            <circle cx="125" cy="179" r="5" fill="#FDE047" />
            <circle cx="97" cy="151" r="5" fill="#FDE047" />
            <circle cx="153" cy="151" r="5" fill="#FDE047" />
          </g>
          <rect
            x="0"
            y="0"
            width="224"
            height="304"
            rx="38"
            fill="none"
            stroke={`url(#${goldId})`}
            strokeWidth="8"
          />
        </g>
      </g>

      {/* FRONT CARD: Swiping Right (Crimson-Rose Clapperboard) */}
      <g
        transform="matrix(0.9781 0.2079 -0.2079 0.9781 58 -40)"
        filter={`url(#${shadowId})`}
      >
        <g transform="translate(144 98)">
          <g clipPath={`url(#${frontClipId})`}>
            <rect x="0" y="0" width="224" height="304" fill={`url(#${roseId})`} />
            <circle cx="112" cy="190" r="110" fill="#FFFFFF" opacity="0.1" />
            <rect x="0" y="0" width="224" height="70" fill="#0D0E15" />
            <rect
              x="0"
              y="68"
              width="224"
              height="4"
              fill="#F5C518"
              opacity="0.8"
            />
            <g fill="#F5C518">
              <polygon points="28,0 56,0 22,70 -6,70" />
              <polygon points="82,0 110,0 76,70 48,70" />
              <polygon points="136,0 164,0 130,70 102,70" />
              <polygon points="190,0 218,0 184,70 156,70" />
              <polygon points="244,0 272,0 238,70 210,70" />
            </g>
          </g>
          <rect
            x="0"
            y="0"
            width="224"
            height="304"
            rx="38"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeOpacity="0.35"
          />
          <g transform="translate(112 186)">
            <path
              d="M-64 -22 L-30 -22"
              stroke="#FFFFFF"
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M-76 0 L-26 0"
              stroke="#FFFFFF"
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.95"
            />
            <path
              d="M-64 22 L-30 22"
              stroke="#FFFFFF"
              strokeWidth="9"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M-12 -38 C-12 -41 -8 -43 -5 -41 L54 -4 C57 -2 57 2 54 4 L-5 41 C-8 43 -12 41 -12 38 Z"
              fill="#FFFFFF"
            />
          </g>
        </g>
      </g>

      {/* Top-Right Cinema Sparkle */}
      <g transform="translate(420 88)">
        <path
          d="M0 -34 Q0 0 34 0 Q0 0 0 34 Q0 0 -34 0 Q0 0 0 -34 Z"
          fill="#FFE066"
        />
        <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
      </g>

      {/* Outer Rim Stroke */}
      <rect
        x="4"
        y="4"
        width="504"
        height="504"
        rx="124"
        fill="none"
        stroke={`url(#${rimId})`}
        strokeWidth="8"
      />
    </g>
    </svg>
  );
}
