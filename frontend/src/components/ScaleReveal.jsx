import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * ScaleReveal — zepmeusel-style image that starts tiny and grows to full
 * size as it enters the viewport on scroll.
 *
 * Props:
 *  src, alt          — image src/alt
 *  className         — classes applied to the outer container
 *  imgClassName      — classes applied to the <img> / inner motion div
 *  initialScale      — scale when element is below viewport (default 0.72)
 *  overlay           — optional overlay element rendered on top
 *  children          — optional children rendered inside (e.g. caption overlay)
 *  rounded           — border-radius class (default 'rounded-2xl')
 */
export default function ScaleReveal({
  src,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  initialScale = 0.72,
  overlay,
  children,
  rounded = 'rounded-2xl',
}) {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.92', 'end 0.55'],
  });

  // Springified for that buttery Lenis-like deceleration
  const springProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  const scale   = useTransform(springProgress, [0, 1], [initialScale, 1]);
  const opacity = useTransform(springProgress, [0, 0.3], [0, 1]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${rounded} ${className}`}
      style={{ willChange: 'transform' }}
    >
      <motion.div
        style={{ scale, opacity }}
        className="w-full h-full origin-center"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={imgClassName}
        />
        {overlay}
      </motion.div>
      {/* Children rendered outside the scaled box (e.g. captions) */}
      {children}
    </div>
  );
}
