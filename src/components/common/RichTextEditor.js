import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import imageCompression from 'browser-image-compression';
import { storageService } from '../../services/storageService';
import { useToast } from '../Toast';

/**
 * RichTextEditor
 * - Stores HTML in form state
 * - Supports headings, basic formatting, lists, code, links
 * - Image button uploads to Firebase Storage and inserts the public URL
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Write description…', imageMaxBytes = 4 * 1024 * 1024 }) {
  const quillRef = useRef(null);
  const { push } = useToast() || { push: () => {} };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        // Custom clipboard + probe buttons before image
        [{ clipboard: 'clipboard' }, { probe: 'probe' }, 'image', 'link'],
        [{ align: [] }],
        ['clean'],
      ],
      handlers: {
        image: async () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.onchange = async () => {
            const file = input.files && input.files[0];
            if (!file) return;
            try {
              if (file.size > imageMaxBytes) {
                // compress
                const compressed = await imageCompression(file, {
                  maxSizeMB: imageMaxBytes / (1024 * 1024),
                  maxWidthOrHeight: 1920,
                  useWebWorker: true,
                });
                await insertUploadedImage(compressed);
              } else {
                await insertUploadedImage(file);
              }
            } catch (err) {
              console.error('Image upload failed', err);
              alert('Image upload failed. If you enabled Storage recently, refresh and try again.');
            }
          };
          input.click();
        },
        clipboard: async () => {
          try {
            // Requires secure context; may fail on http
            if (navigator.clipboard && navigator.clipboard.read) {
              const items = await navigator.clipboard.read();
              for (const item of items) {
                const type = item.types.find((t) => t.startsWith('image/'));
                if (type) {
                  const blob = await item.getType(type);
                  const file = new File([blob], 'pasted-image.png', { type });
                  await insertUploadedImage(file);
                  return;
                }
              }
              // Fallback: try text URL
              const text = await navigator.clipboard.readText();
              if (text && /^https?:\/\//i.test(text)) {
                insertLinkAtSelection(text);
                return;
              }
            }
            alert('Paste from clipboard is not available. Use Ctrl+V to paste images or links.');
          } catch (err) {
            console.warn('Clipboard read failed', err);
            alert('Clipboard access denied. Use Ctrl+V to paste.');
          }
        },
        probe: async () => {
          try {
            const tinyBlob = await new Promise((resolve) => {
              const canvas = document.createElement('canvas');
              canvas.width = 1; canvas.height = 1;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#00AA00';
              ctx.fillRect(0, 0, 1, 1);
              canvas.toBlob((b) => resolve(b), 'image/png', 0.7);
            });
            const file = new File([tinyBlob], 'probe.png', { type: 'image/png' });
            const result = await storageService.uploadEditorAsset(file);
            push({ variant: 'success', message: `Storage probe upload OK: ${result.path}` });
          } catch (err) {
            push({ variant: 'error', message: `Storage probe failed: ${err?.message || 'Unknown error'}` });
          }
        }
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }), [imageMaxBytes]);

  const formats = useMemo(() => [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'list', 'bullet', 'link', 'image', 'align', 'color', 'background'
  ], []);

  const insertUploadedImage = async (file) => {
    const { downloadURL } = await storageService.uploadEditorAsset(file);
    const editor = quillRef.current && quillRef.current.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const insertIndex = range ? range.index : editor.getLength();
    editor.insertEmbed(insertIndex, 'image', downloadURL, 'user');
    editor.setSelection(insertIndex + 1, 0);
  };

  const insertLinkAtSelection = (url) => {
    const editor = quillRef.current && quillRef.current.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    if (range) {
      editor.format('link', url);
    } else {
      const insertIndex = editor.getLength();
      editor.insertText(insertIndex, url, 'link', url);
    }
  };

  return (
    <div className="input-field p-0 tc-richtext" style={{ overflow: 'visible' }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(html) => onChange && onChange(html)}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}


