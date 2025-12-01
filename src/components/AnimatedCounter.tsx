import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 500,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const difference = endValue - startValue;

    if (difference === 0) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);

      const currentValue = Math.round(startValue + difference * easeOutQuad);
      setDisplayValue(currentValue);

      if (progress === 1) {
        clearInterval(timer);
        previousValue.current = endValue;
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};
