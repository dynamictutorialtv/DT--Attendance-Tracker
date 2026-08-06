import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 56, showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm select-none"
      >
        {/* Outer Ring Background */}
        <circle cx="150" cy="150" r="145" fill="#E0F7FA" />
        
        {/* Outer Purple Border */}
        <circle cx="150" cy="150" r="144" stroke="#9333EA" strokeWidth="6" fill="none" />
        {/* Inner Cyan Border */}
        <circle cx="150" cy="150" r="136" stroke="#0284C7" strokeWidth="5" fill="none" />
        
        {/* Main Inner Circle Content */}
        <circle cx="150" cy="150" r="128" fill="#B3EBF2" />

        {/* DT Graphic Monogram */}
        <g transform="translate(85, 38)">
          {/* Stylized 'D' */}
          <path
            d="M 5 10 L 48 10 C 72 10 90 28 90 52 C 90 76 72 94 48 94 L 28 94 L 28 42 L 5 42 Z"
            fill="#2563EB"
          />
          <path
            d="M 28 30 L 48 30 C 60 30 70 38 70 52 C 70 66 60 74 48 74 L 28 74 Z"
            fill="#B3EBF2"
          />
          {/* Stylized 'T' overlapping */}
          <path
            d="M 45 32 L 122 32 L 122 50 L 92 50 L 92 110 L 71 110 L 71 50 L 45 50 Z"
            fill="#09090B"
          />
        </g>

        {/* "DYNAMIC" Text */}
        <text
          x="150"
          y="180"
          textAnchor="middle"
          fill="#0F172A"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="31"
          letterSpacing="1.5"
        >
          DYNAMIC
        </text>

        {/* Banner for "TUTORIAL" */}
        <polygon points="45,193 255,193 238,232 62,232" fill="#0284C7" />
        <text
          x="150"
          y="223"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="26"
          letterSpacing="3"
        >
          TUTORIAL
        </text>

        {/* "Origin of Sagacity" Subtitle */}
        <text
          x="150"
          y="256"
          textAnchor="middle"
          fill="#B45309"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontWeight="700"
          fontSize="17"
        >
          Discuss & Explore
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
            DYNAMIC <span className="text-sky-600">TUTORIAL</span>
          </span>
          <span className="text-xs font-medium text-amber-700 italic mt-0.5">
            Origin of Sagacity
          </span>
        </div>
      )}
    </div>
  );
};
