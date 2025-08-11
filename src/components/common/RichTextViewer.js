import React from 'react';
import DOMPurify from 'dompurify';

export default function RichTextViewer({ html }) {
  if (!html) return <div className="input-field bg-white/5 cursor-default select-text">—</div>;
  const safe = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return <div className="prose prose-invert max-w-none input-field bg-white/5 cursor-default select-text" dangerouslySetInnerHTML={{ __html: safe }} />;
}


