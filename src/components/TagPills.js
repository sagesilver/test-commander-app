import React from 'react';

/**
 * Renders a list of tag pills given an array of tag objects.
 * Each tag: { id: string, name: string, color: string }
 */
export default function TagPills({
  tags = [],
  onTagClick,
  className = '',
  size = 'sm',
}) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : size === 'md'
      ? 'text-sm px-2.5 py-1'
      : 'text-sm px-3 py-1.5';

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.filter(Boolean).map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onTagClick?.(tag)}
          className={`rounded-full text-white hover:brightness-110 transition-colors ${sizeClasses}`}
          style={{ backgroundColor: tag.color || '#64748b' }}
          title={tag.name}
        >
          {tag.name}
        </button>
      ))}
      {tags.length === 0 && (
        <span className={`rounded-full bg-white/5 text-menu ${sizeClasses}`}>—</span>
      )}
    </div>
  );
}


