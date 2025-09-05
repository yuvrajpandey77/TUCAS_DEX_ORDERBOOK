
const FloatingOrbs = () => {
  // Subtle, theme-driven orbs using CSS variables for a professional look
  const orbs = [
    {
      gradient: 'radial-gradient(circle, hsl(var(--primary) / 0.18), transparent 60%)',
      size: 'w-72 h-72',
      position: 'top-24 left-16',
      animation: 'animate-float',
      opacity: 0.25,
    },
    {
      gradient: 'radial-gradient(circle, hsl(var(--secondary) / 0.15), transparent 65%)',
      size: 'w-96 h-96',
      position: 'bottom-24 right-24',
      animation: 'animate-float2',
      opacity: 0.22,
    },
    {
      gradient: 'radial-gradient(circle, hsl(45 85% 62% / 0.12), transparent 70%)',
      size: 'w-80 h-80',
      position: 'top-1/3 right-1/4',
      animation: 'animate-float3',
      opacity: 0.2,
    },
    {
      gradient: 'radial-gradient(circle, hsl(220 20% 16% / 0.18), transparent 70%)',
      size: 'w-64 h-64',
      position: 'bottom-1/4 left-1/3',
      animation: 'animate-float',
      opacity: 0.18,
    },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {orbs.map((orb, index) => (
        <div
          key={index}
          className={`floating-orb ${orb.size} ${orb.position} ${orb.animation}`}
          style={{
            animationDelay: `${index * 2}s`,
            background: orb.gradient,
            opacity: orb.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingOrbs;