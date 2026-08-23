import React from 'react';

interface EseaLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
}

export const EseaLogo: React.FC<EseaLogoProps> = ({
  size = 48,
  className = '',
  showText = false,
  textClassName = '',
  subtitle = "Université Cheikh Anta Diop de Dakar",
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none shadow-sm rounded-full"
      >
        {/* Background Circle - Yellow Official Color */}
        <circle cx="100" cy="100" r="98" fill="#FFCC00" stroke="#004A8F" strokeWidth="2.5" />
        
        {/* Inner thin decorative ring */}
        <circle cx="100" cy="100" r="92" fill="none" stroke="#DCA200" strokeWidth="0.8" strokeDasharray="3 2" />

        {/* Quadrant Corner Markers - Navy Blue stylized bracket corners */}
        {/* Top-Left Quadrant */}
        <path d="M40 76 H82 V34" stroke="#005696" strokeWidth="6" strokeLinecap="square" fill="none" />
        <text x="50" y="58" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#003566" textAnchor="middle">E</text>
        <text x="70" y="58" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#003566" textAnchor="middle">R</text>
        <text x="60" y="72" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8" fill="#FFFFFF" textAnchor="middle" letterSpacing="1">ATEDI</text>

        {/* Top-Right Quadrant */}
        <path d="M160 76 H118 V34" stroke="#005696" strokeWidth="6" strokeLinecap="square" fill="none" />
        <text x="130" y="58" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#003566" textAnchor="middle">A</text>
        <text x="150" y="58" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#003566" textAnchor="middle">S</text>
        <text x="140" y="72" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8" fill="#FFFFFF" textAnchor="middle" letterSpacing="1">DECF</text>

        {/* Bottom-Left Quadrant */}
        <path d="M40 124 H82 V166" stroke="#005696" strokeWidth="6" strokeLinecap="square" fill="none" />
        <text x="60" y="120" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8" fill="#FFFFFF" textAnchor="middle" letterSpacing="1">STADE</text>
        <text x="50" y="152" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#003566" textAnchor="middle">A</text>
        <text x="70" y="152" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#003566" textAnchor="middle">T</text>

        {/* Bottom-Right Quadrant */}
        <path d="M160 124 H118 V166" stroke="#005696" strokeWidth="6" strokeLinecap="square" fill="none" />
        <text x="140" y="120" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8" fill="#FFFFFF" textAnchor="middle" letterSpacing="1">PEDD</text>
        <text x="130" y="152" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#003566" textAnchor="middle">C</text>
        <text x="150" y="152" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#003566" textAnchor="middle">E</text>

        {/* Center Circular Emblem with Concentric Rings */}
        <circle cx="100" cy="100" r="28" fill="#FFDE33" stroke="#B28900" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="23" fill="none" stroke="#B28900" strokeWidth="0.75" strokeDasharray="1.5 1.5" />

        {/* Text around center seal */}
        <path id="circlePathTop" d="M 76 100 A 24 24 0 0 1 124 100" fill="none" stroke="none" />
        <text fontSize="4.8" fontWeight="700" fill="#6B5300" textAnchor="middle">
          <textPath href="#circlePathTop" startOffset="50%">
            ÉCOLE SUPÉRIEURE D'ÉCONOMIE
          </textPath>
        </text>

        <path id="circlePathBottom" d="M 76 100 A 24 24 0 0 0 124 100" fill="none" stroke="none" />
        <text fontSize="4.8" fontWeight="700" fill="#6B5300" textAnchor="middle">
          <textPath href="#circlePathBottom" startOffset="50%">
            APPLIQUÉE • DAKAR
          </textPath>
        </text>

        {/* Center ESEA acronym */}
        <text
          x="100"
          y="104"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          fontSize="14"
          fill="#003865"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          ESEA
        </text>
      </svg>

      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-lg transition-colors">
              ESEA
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">Collect</span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded tracking-wider uppercase ml-1">
              UCAD
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate max-w-[200px] sm:max-w-none mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
