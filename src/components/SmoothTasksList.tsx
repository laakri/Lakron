import React, {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';

interface SmoothTasksListProps<T> {
  tasks: T[];
  renderTask: (task: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  maxHeight?: number;
}

export function SmoothTasksList<T>({
  tasks,
  renderTask,
  emptyState = null,
  className = '',
  maxHeight = 320,
}: SmoothTasksListProps<T>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(Date.now());
  const lastScrollY = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const [scrollY, setScrollY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const shouldAnimate = tasks.length > 3;

  useEffect(() => {
    if (!shouldAnimate || isScrolling || Math.abs(velocity) <= 0.1) return;

    const animate = () => {
      setVelocity((v) => v * 0.92); // Friction
      setScrollY((y) => {
        const newY = y + velocity;
        const maxScroll =
          scrollRef.current?.scrollHeight! - scrollRef.current?.clientHeight!;
        return Math.max(0, Math.min(newY, maxScroll));
      });

      if (Math.abs(velocity) > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      }
      
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isScrolling, velocity, shouldAnimate]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!shouldAnimate) return;

    const currentTime = Date.now();
    const currentY = e.currentTarget.scrollTop;
    const timeDelta = currentTime - lastScrollTime.current;
    const yDelta = currentY - lastScrollY.current;

    setScrollY(currentY);

    if (timeDelta > 0) {
      setVelocity((yDelta / timeDelta) * 16);
    }

    lastScrollTime.current = currentTime;
    lastScrollY.current = currentY;
    setIsScrolling(true);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  const getItemStyle = (index: number, itemHeight = 80): CSSProperties => {
    if (!shouldAnimate || !scrollRef.current) return {};

    const containerHeight = scrollRef.current.clientHeight;
    const itemCenter = index * itemHeight + itemHeight / 2;
    const scrollCenter = scrollY + containerHeight / 2;
    const distance = Math.abs(itemCenter - scrollCenter);
    const maxDistance = containerHeight / 2;
    const normalized = Math.min(distance / maxDistance, 1);

    const scale = 1 - normalized * 0.1;
    const opacity = 1 - normalized * 0.3;
    const translateZ = -normalized * 20;
    const rotateX = normalized * 2;
    const curve = Math.sin(normalized * Math.PI / 2) * 2;

    return {
      transform: `
        perspective(1000px)
        translateZ(${translateZ}px)
        rotateX(${rotateX}deg)
        translateX(${curve}px)
        scale(${scale})
      `,
      opacity,
      zIndex: Math.round((1 - normalized) * 100),
      transition: isScrolling
        ? 'none'
        : 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    };
  };

  if (tasks.length === 0) return <>{emptyState}</>;

  return (
    <div className={`relative ${className} bg-transparent `}>
  
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative overflow-y-auto overflow-x-hidden max-w-full w-full"
        style={{
          maxHeight,
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: isScrolling ? 'auto' : 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          className="relative "
          style={shouldAnimate ? { perspective: '1000px' } : {}}
        >
          {tasks.map((task, index) => (
            <div
              key={(task as any).id || index}
              className="relative mb-2  max-w-full w-full"
              style={getItemStyle(index)}
            >
              <div className="transform-gpu w-full">
                {renderTask(task, index)}
              </div>
  
              {shouldAnimate && (
                <div
                  className="absolute inset-0 rounded-xl shadow-lg opacity-20 pointer-events-none"
                  style={{
                    transform: 'translateY(2px) scale(0.98)',
                    background:
                      'linear-gradient(to bottom, transparent, rgba(0,0,0,0.1))',
                  }}
                />
              )}
            </div>
          ))}
          <div className="h-4" />
        </div>
      </div>
  
      {/* Hide scrollbars */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
  
}


export default SmoothTasksList;
