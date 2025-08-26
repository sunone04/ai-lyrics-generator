'use client';

import { useRef } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  ListBulletIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write your content here...", 
  rows = 15,
  className = ""
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertHeading = (level: number) => {
    const heading = '#'.repeat(level) + ' ';
    insertText('\n' + heading, '\n');
  };

  const insertList = (type: 'ul' | 'ol') => {
    if (type === 'ul') {
      insertText('\n- ', '\n');
    } else {
      insertText('\n1. ', '\n');
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertText('[', `](${url})`);
    }
  };

  const formatButtons = [
    {
      label: 'H1',
      onClick: () => insertHeading(1),
      className: 'text-lg font-bold'
    },
    {
      label: 'H2',
      onClick: () => insertHeading(2),
      className: 'text-base font-bold'
    },
    {
      label: 'H3',
      onClick: () => insertHeading(3),
      className: 'text-sm font-bold'
    },
    {
      icon: BoldIcon,
      label: 'Bold',
      onClick: () => insertText('<strong>', '</strong>')
    },
    {
      icon: ItalicIcon,
      label: 'Italic',
      onClick: () => insertText('<em>', '</em>')
    },
    {
      icon: ListBulletIcon,
      label: 'Bullet List',
      onClick: () => insertList('ul')
    },
    {
      label: 'OL',
      onClick: () => insertList('ol'),
      className: 'text-sm font-medium'
    },
    {
      icon: LinkIcon,
      label: 'Link',
      onClick: insertLink
    }
  ];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
        {formatButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.onClick}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title={button.label}
          >
            {button.icon ? (
              <button.icon className="w-4 h-4" />
            ) : (
              <span className={button.className || 'text-sm font-medium'}>
                {button.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 ${className}`}
        placeholder={placeholder}
        style={{ resize: 'vertical' }}
      />

      {/* Help text */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>You can use HTML tags for formatting:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <strong>Headings:</strong> &lt;h2&gt;, &lt;h3&gt;, &lt;h4&gt;
          </div>
          <div>
            <strong>Text:</strong> &lt;strong&gt;, &lt;em&gt;, &lt;p&gt;
          </div>
          <div>
            <strong>Lists:</strong> &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;
          </div>
          <div>
            <strong>Links:</strong> &lt;a href="..."&gt;
          </div>
        </div>
      </div>
    </div>
  );
}