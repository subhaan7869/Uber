import React from 'react';

export const HyperDriverLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    sm: { height: 40, width: 40 },
    md: { height: 64, width: 64 },
    lg: { height: 96, width: 96 },
    xl: { height: 156, width: 156 },
  }[size];

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none`}
    >
      <defs>
        <linearGradient id="hdBgInnerGrad" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D1930" />
          <stop offset="45%" stopColor="#070D19" />
          <stop offset="100%" stopColor="#03050A" />
        </linearGradient>

        <linearGradient id="hdBorderGrad" x1="36" y1="120" x2="476" y2="392" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00AEFF" />
          <stop offset="50%" stopColor="#0077FF" />
          <stop offset="100%" stopColor="#0040FF" />
        </linearGradient>

        <linearGradient id="hdSpeedBarTop" x1="156" y1="165" x2="245" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C8FF" />
          <stop offset="100%" stopColor="#0055FF" />
        </linearGradient>
        <linearGradient id="hdSpeedBarMid" x1="120" y1="202" x2="225" y2="202" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00DCFF" />
          <stop offset="100%" stopColor="#0051FF" />
        </linearGradient>
        <linearGradient id="hdSpeedBarBot" x1="142" y1="239" x2="225" y2="239" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B8FF" />
          <stop offset="100%" stopColor="#0044FF" />
        </linearGradient>

        <linearGradient id="hdHGrad" x1="256" y1="125" x2="256" y2="275" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E6EEF8" />
        </linearGradient>

        <filter id="hdBorderGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded Squircle App Icon Frame */}
      <rect
        x="38"
        y="38"
        width="436"
        height="436"
        rx="102"
        fill="url(#hdBgInnerGrad)"
        stroke="url(#hdBorderGrad)"
        strokeWidth="12"
        filter="url(#hdBorderGlow)"
      />

      {/* Three Horizontal Rounded Speed Bars on Left of H */}
      <rect x="157" y="154" width="84" height="22" rx="11" fill="url(#hdSpeedBarTop)" />
      <rect x="121" y="191" width="98" height="22" rx="11" fill="url(#hdSpeedBarMid)" />
      <rect x="142" y="228" width="76" height="22" rx="11" fill="url(#hdSpeedBarBot)" />

      {/* Bold Slanted White 'H' */}
      <path
        d="M 244 128 L 286 128 L 271 182 L 326 182 L 341 128 L 383 128 L 343 272 L 301 272 L 318 212 L 263 212 L 246 272 L 204 272 Z"
        fill="url(#hdHGrad)"
      />

      {/* "Hyper" Typography */}
      <text
        x="256"
        y="355"
        fill="#FFFFFF"
        fontFamily="'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="88"
        fontWeight="900"
        letterSpacing="-1.5"
        textAnchor="middle"
      >
        Hyper
      </text>

      {/* "D R I V E R" Typography */}
      <text
        x="262"
        y="404"
        fill="#009EFF"
        fontFamily="'Inter', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="14"
        textAnchor="middle"
      >
        DRIVER
      </text>
    </svg>
  );
};
