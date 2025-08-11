import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ColoredIcon({ icon, size = 18, className = '' }) {
  const { theme } = useTheme();
  if (!icon || !icon.url) return null;
  const color = theme === 'dark' ? (icon.colorDark || '#60a5fa') : (icon.colorLight || '#2563eb');
  const px = typeof size === 'number' ? `${size}px` : size;
  const style = {
    WebkitMaskImage: `url(${icon.url})`,
    maskImage: `url(${icon.url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    backgroundColor: color,
    width: px,
    height: px,
    display: 'inline-block',
  };
  return <span className={className} style={style} aria-hidden="true" />;
}


