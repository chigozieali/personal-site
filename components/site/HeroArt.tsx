const TEETH = [0, 45, 90, 135, 180, 225, 270, 315];

const CODE_LINES = [
  { y: 98, width: 116, accent: false, delay: "0s" },
  { y: 112, width: 84, accent: true, delay: ".35s" },
  { y: 126, width: 136, accent: false, delay: ".7s" },
  { y: 140, width: 58, accent: false, delay: "1.05s" },
];

export default function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 340 260" role="presentation" focusable="false">
        <defs>
          <pattern id="hero-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="var(--line)" />
          </pattern>
        </defs>

        <rect
          x="6"
          y="6"
          width="328"
          height="248"
          rx="16"
          fill="var(--paper)"
          stroke="var(--line)"
        />
        <rect
          x="6"
          y="6"
          width="328"
          height="248"
          rx="16"
          fill="url(#hero-dots)"
          opacity=".45"
        />

        {/* monitor */}
        <rect
          x="44"
          y="54"
          width="208"
          height="126"
          rx="12"
          fill="var(--bg)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        <path d="M56 80h184" stroke="var(--line)" strokeWidth="1.5" />
        <circle cx="60" cy="68" r="3" fill="var(--line)" />
        <circle cx="72" cy="68" r="3" fill="var(--line)" />
        <circle cx="84" cy="68" r="3" fill="var(--line)" />
        <rect x="98" y="63" width="52" height="10" rx="5" fill="var(--line)" />

        {/* code being typed */}
        {CODE_LINES.map((line) => (
          <rect
            key={line.y}
            className="art-line"
            x="60"
            y={line.y}
            width={line.width}
            height="7"
            rx="3.5"
            fill={line.accent ? "var(--accent)" : "var(--line)"}
            opacity={line.accent ? ".8" : ".7"}
            style={{ animationDelay: line.delay }}
          />
        ))}
        <rect
          className="art-cursor"
          x="200"
          y="124"
          width="7"
          height="11"
          rx="2"
          fill="var(--accent)"
        />

        {/* progress */}
        <rect
          x="60"
          y="158"
          width="150"
          height="6"
          rx="3"
          fill="var(--line)"
          opacity=".6"
        />
        <rect
          className="art-progress"
          x="60"
          y="158"
          width="150"
          height="6"
          rx="3"
          fill="var(--accent)"
        />

        {/* stand */}
        <path d="M132 180h32l10 18h-52z" fill="var(--line)" />
        <rect
          x="116"
          y="198"
          width="64"
          height="6"
          rx="3"
          fill="var(--ink)"
          opacity=".15"
        />

        {/* gear */}
        <g transform="translate(292 74)">
          <g className="art-gear">
            <circle r="15" fill="none" stroke="var(--accent)" strokeWidth="3" />
            <circle r="5.5" fill="none" stroke="var(--accent)" strokeWidth="3" />
            {TEETH.map((angle) => (
              <rect
                key={angle}
                x="-2.5"
                y="-22.5"
                width="5"
                height="8"
                rx="2"
                fill="var(--accent)"
                transform={`rotate(${angle})`}
              />
            ))}
          </g>
        </g>

        {/* wrench */}
        <g transform="translate(292 198) rotate(-35)">
          <g className="art-wrench">
            <path d="M-2.5 0h5v22a2.5 2.5 0 0 1-5 0z" fill="var(--ink)" opacity=".5" />
            <path
              d="M-9 -2a9 9 0 1 1 18 0v4h-5v-4a4 4 0 1 0-8 0v4h-5z"
              fill="var(--accent)"
            />
          </g>
        </g>

        {/* resolved */}
        <g transform="translate(40 198)">
          <circle className="art-ring" r="15" fill="none" stroke="var(--accent)" />
          <g className="art-badge">
            <circle r="15" fill="var(--accent)" />
            <path
              d="M-6 0l4.5 4.5 8-9"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* sparks */}
        <g transform="translate(302 142)">
          <path
            className="art-spark"
            d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
            fill="var(--mark)"
          />
        </g>
        <g transform="translate(24 112)">
          <path
            className="art-spark"
            d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
            fill="var(--mark)"
            style={{ animationDelay: "1.2s" }}
          />
        </g>
      </svg>
    </div>
  );
}
