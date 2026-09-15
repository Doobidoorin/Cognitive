const SCALE_STOPS = [
  { max: 85, label: "Below Average", color: "#93c5fd" },
  { max: 105, label: "Average", color: "#7dd6ff" },
  { max: 114, label: "Above Average", color: "#8be2c8" },
  { max: 129, label: "High", color: "#8be28f" },
  { max: 144, label: "Very High", color: "#ffd166" },
  { max: Infinity, label: "Exceptional / Genius", color: "#ff9ecb" },
];

const SCALE_MIN = 55;
const SCALE_MAX = 160;

export function BrainScale({ score }: { score: number }) {
  const clamped = Math.min(Math.max(score, SCALE_MIN), SCALE_MAX);
  const positionPct = ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Brain visual */}
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div className="absolute inset-0 animate-float rounded-full bg-aero-glow/40 blur-2xl" />
        <svg viewBox="0 0 200 200" className="relative h-36 w-36 drop-shadow-[0_8px_24px_rgba(14,165,233,0.35)]">
          <defs>
            <linearGradient id="brain-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#bfe9ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path
            d="M100 30c-22 0-38 14-42 32-16 4-26 20-22 36-10 8-14 24-4 36 2 16 18 28 34 26 6 10 18 16 34 14 10 8 24 8 34 0 16 2 28-10 34-26 10 2 20-6 22-18 8-8 8-22-2-30 4-16-6-32-22-36-4-18-20-34-42-34-8 0-16 2-24 6z"
            fill="url(#brain-gradient)"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <path
            d="M100 46c-4 18 6 30 0 48-6 18 8 32 2 50M78 58c-8 14 2 24-4 40M132 60c8 12 0 24 6 38"
            stroke="#0c74b3"
            strokeOpacity="0.35"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-5xl font-extrabold text-sky-900">{score}</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">IQ-style score</p>
      </div>

      {/* Scale */}
      <div className="w-full max-w-lg">
        <div className="relative h-4 w-full overflow-hidden rounded-full shadow-inner">
          <div className="flex h-full w-full">
            {SCALE_STOPS.map((s, i) => (
              <div key={i} className="h-full flex-1" style={{ background: s.color }} />
            ))}
          </div>
          <div
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-sky-900 bg-white shadow-lg"
            style={{ left: `${positionPct}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-x-1 gap-y-1 text-center text-[10px] font-semibold uppercase tracking-wide text-sky-700 sm:grid-cols-6">
          {SCALE_STOPS.map((s, i) => (
            <span key={i}>{s.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
