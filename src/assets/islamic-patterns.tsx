import React from "react";

/**
 * Islamic geometric pattern SVG strings for decorative use
 */

// 8-pointed star pattern (inline SVG for backgrounds)
export const starPatternSvg = `
<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.15">
    <path d="M30 0v60M0 30h60"/>
    <path d="M30 10l20 20-20 20-20-20z"/>
    <circle cx="30" cy="30" r="15"/>
    <path d="M15 15h30v30H15z" transform="rotate(45 30 30)"/>
  </g>
</svg>
`;

// Arabesque corner decoration
export const CornerDecoration = ({ className = "" }: { className?: string }) => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M0 60C0 26.9 26.9 0 60 0"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.2"
        />
        <path
            d="M0 45C0 20.1 20.1 0 45 0"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.15"
        />
        <path
            d="M0 30C0 13.4 13.4 0 30 0"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeOpacity="0.1"
        />
    </svg>
);

// Crescent moon SVG component
export const CrescentMoon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M21.5 12c0 5.25-4.25 9.5-9.5 9.5-3.04 0-5.74-1.43-7.48-3.66A9.5 9.5 0 0 0 12 2.5c.34 0 .68.02 1.01.05A7.5 7.5 0 0 0 21.5 12Z"
            fill="currentColor"
        />
    </svg>
);

// Diamond shape (from Rafiq logo)
export const DiamondAccent = ({ className = "", size = 16 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M8 0L16 8L8 16L0 8L8 0Z"
            fill="currentColor"
        />
    </svg>
);

// Decorative divider with Islamic motif
export const IslamicDivider = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <DiamondAccent size={8} className="text-gold" />
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
);
