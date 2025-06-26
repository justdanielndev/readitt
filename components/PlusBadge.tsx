'use client';
import { useState, useEffect, useRef } from 'react';
interface PlusBadgeProps {
  onClick?: () => void;
}
export function PlusBadge({ onClick }: PlusBadgeProps) {
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const textColors = [
    'text-rose-500', 
    'text-orange-400', 
    'text-amber-500', 
    'text-emerald-500', 
    'text-cyan-500', 
    'text-purple-500', 
  ];
  const prideFlagColors = {
    pride: [
      'text-rose-500',
      'text-orange-400',
      'text-amber-500',
      'text-emerald-500',
      'text-cyan-500',
      'text-purple-500',
    ],
    trans: [
      'text-blue-300',
      'text-pink-300',
      'text-white',
      'text-pink-300',
      'text-blue-300',
    ],
    pan: [
      'text-pink-400',
      'text-yellow-400',
      'text-blue-400',
    ],
    bi: [
      'text-pink-400',
      'text-purple-400',
      'text-blue-400',
    ],
    nonbinary: [
      'text-yellow-400',
      'text-white',
      'text-purple-400',
      'text-gray-800',
    ]
  };
  const flagNames = ['pride', 'trans', 'pan', 'bi', 'nonbinary'] as const;
  const handleClick = () => {
    if (!isAnimating) {
      setCurrentColorIndex((prev) => (prev + 1) % textColors.length);
    }
    onClick?.();
  };
  const handleMouseDown = () => {
    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(true);
      startPrideAnimation();
    }, 500);
  };
  const handleMouseUp = () => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  const handleMouseLeave = () => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  const startPrideAnimation = () => {
    const currentFlag = flagNames[currentFlagIndex];
    const flagColors = prideFlagColors[currentFlag];
    let colorIndex = 0;
    const animateColors = () => {
      setCurrentColorIndex(colorIndex % flagColors.length);
      colorIndex++;
      if (colorIndex < flagColors.length * 3) { 
        animationRef.current = setTimeout(animateColors, 200);
      } else {
        setIsAnimating(false);
        setCurrentFlagIndex((prev) => (prev + 1) % flagNames.length);
        setCurrentColorIndex(0);
      }
    };
    animateColors();
  };
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);
  const getCurrentTextColor = () => {
    if (isAnimating) {
      const currentFlag = flagNames[currentFlagIndex];
      const flagColors = prideFlagColors[currentFlag];
      return flagColors[currentColorIndex];
    }
    return textColors[currentColorIndex];
  };
  return (
    <span
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className={`
        text-2xl font-bold cursor-pointer select-none ml-2
        transition-all duration-200 ease-in-out
        hover:scale-105 active:scale-95
        ${getCurrentTextColor()}
        ${isPressed ? 'scale-95' : ''}
        ${isAnimating ? 'animate-pulse' : ''}
      `}
      title="Readitt Plus - Premium features"
    >
      plus
    </span>
  );
}