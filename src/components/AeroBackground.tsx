export function AeroBackground() {
  const bubbles = [
    { size: 90, top: "8%", left: "6%", delay: "0s" },
    { size: 50, top: "18%", left: "82%", delay: "1.2s" },
    { size: 130, top: "62%", left: "88%", delay: "0.4s" },
    { size: 60, top: "78%", left: "10%", delay: "2s" },
    { size: 40, top: "40%", left: "50%", delay: "0.8s" },
    { size: 70, top: "4%", left: "45%", delay: "1.6s" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* soft horizon glow */}
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-gradient-to-b from-white/40 via-sky-100/10 to-transparent" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-aero-leaf/30 blur-3xl" />
      <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-aero-glow/50 blur-3xl" />

      {bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble animate-float"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            animationDelay: b.delay,
          }}
        />
      ))}

      {/* subtle glass "skyline" silhouette along the bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-40"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="skyline-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#bfe9ff" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          fill="url(#skyline-glass)"
          d="M0,120 L60,120 L60,60 L120,60 L120,100 L200,100 L200,40 L260,40 L260,90 L340,90 L340,20 L420,20 L420,80 L520,80 L520,50 L600,50 L600,110 L700,110 L700,30 L780,30 L780,95 L880,95 L880,55 L960,55 L960,105 L1060,105 L1060,45 L1140,45 L1140,115 L1200,115 L1200,160 L0,160 Z"
        />
      </svg>
    </div>
  );
}
