export const PFP_PRESETS: { key: string; emoji: string; gradient: string }[] = [
  { key: "preset:aqua", emoji: "🌊", gradient: "linear-gradient(160deg,#7dd6ff,#0ea5e9)" },
  { key: "preset:mint", emoji: "🍃", gradient: "linear-gradient(160deg,#b6f3c9,#34c78a)" },
  { key: "preset:sun", emoji: "☀️", gradient: "linear-gradient(160deg,#ffe9a8,#ffb84d)" },
  { key: "preset:glass", emoji: "🔷", gradient: "linear-gradient(160deg,#e0f7ff,#8bd3ff)" },
  { key: "preset:bloom", emoji: "🌸", gradient: "linear-gradient(160deg,#ffd6e8,#ff8fb8)" },
  { key: "preset:nova", emoji: "✨", gradient: "linear-gradient(160deg,#e6d6ff,#a78bfa)" },
  { key: "preset:coral", emoji: "🪸", gradient: "linear-gradient(160deg,#ffcab0,#ff7a59)" },
  { key: "preset:orbit", emoji: "🛰️", gradient: "linear-gradient(160deg,#c9e9ff,#4f9de0)" },
];

export function Avatar({ pfp, size = 44 }: { pfp?: string | null; size?: number }) {
  const preset = PFP_PRESETS.find((p) => p.key === pfp);

  if (pfp && pfp.startsWith("data:image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={pfp}
        alt="Profile picture"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white/80 shadow"
      />
    );
  }

  const p = preset ?? PFP_PRESETS[0];
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-white/80 shadow"
      style={{ width: size, height: size, background: p.gradient, fontSize: size * 0.5 }}
      aria-label="Profile picture"
    >
      {p.emoji}
    </div>
  );
}
