import React, { useMemo, useState } from 'react';

/**
 * A lightweight multi-select for tags with inline new-tag creation (mock only).
 * props:
 * - availableTags: [{ id, name, color }]
 * - value: string[] (array of tag ids)
 * - onChange: (ids: string[]) => void
 * - onAddTag?: (tag: { id, name, color }) => void (optional, mock add)
 * - label?: string (omit/empty to hide)
 */
export default function TagMultiSelect({
  availableTags = [],
  value = [],
  onChange,
  onAddTag,
  label = 'Tags',
}) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#0ea5e9');

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange?.(Array.from(next));
  };

  const addTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const tag = { id, name, color: newTagColor };
    onAddTag?.(tag);
    setNewTagName('');
  };

  return (
    <div>
      {Boolean(label) && (
        <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      )}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-subtle bg-surface-muted">
          {availableTags.length === 0 && (
            <span className="text-sm text-menu">No tags yet</span>
          )}
          {availableTags.map((t) => {
            const isSelected = selectedSet.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={`rounded-full px-2.5 py-1 text-sm border transition-colors ${isSelected ? 'text-white' : 'text-white/80'}`}
                style={{
                  backgroundColor: isSelected ? t.color : 'transparent',
                  borderColor: t.color,
                }}
                title={t.name}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Inline add new tag (mock) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
          <input
            className="input-field md:col-span-3"
            type="text"
            placeholder="Add new tag (mock)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <input
            className="input-field md:col-span-1"
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            title="Tag color"
          />
          <button type="button" className="btn-secondary md:col-span-1" onClick={addTag}>Add</button>
        </div>
      </div>
    </div>
  );
}


