import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
  hideCursorOnComplete?: boolean;
}

export default function Typewriter({ text, delay = 0, className = "", hideCursorOnComplete = false }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, 50); // Typing speed

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  const showCursor = !hideCursorOnComplete || !isComplete;

  return (
    <Motion.span 
      className={`inline-flex items-center ${className}`}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {displayedText}
      <Motion.span 
        animate={{ opacity: showCursor ? [1, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className={`inline-block w-[3px] h-[1em] ml-1 bg-current align-middle ${!showCursor ? 'hidden' : ''}`}
      />
    </Motion.span>
  );
}