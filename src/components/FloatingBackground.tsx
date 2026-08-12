const ICONS = ["⭐", "🌈", "🎈", "☁️", "✨", "🦋", "🌸", "🍭"];

/** 배경에 둥둥 떠다니는 장식 이모지들 (순수 CSS 애니메이션, 접근성 트리에서는 숨김) */
export default function FloatingBackground() {
  const items = ICONS.map((icon, i) => ({
    icon,
    top: `${(i * 37) % 90}%`,
    left: `${(i * 53) % 92}%`,
    delay: `${i * 0.6}s`,
    duration: `${5 + (i % 4)}s`,
  }));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
      {items.map((item, i) => (
        <span
          key={i}
          className="absolute text-4xl sm:text-5xl animate-float"
          style={{
            top: item.top,
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}
