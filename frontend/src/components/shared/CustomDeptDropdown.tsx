import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomDeptDropdownProps {
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomDeptDropdown({
  value,
  options,
  onSelect,
  onRemove,
  placeholder = 'Select...',
  className = '',
}: CustomDeptDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input w-full text-left flex items-center justify-between gap-2"
      >
        <span className={value ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onSelect(''); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-50"
          >
            {placeholder}
          </button>

          {options.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group"
            >
              <button
                type="button"
                onClick={() => { onSelect(name); setOpen(false); }}
                className={`text-left text-xs flex-1 min-w-0 truncate ${
                  value === name ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                {name}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(name); }}
                className="ml-2 text-gray-300 hover:text-red-500 text-base leading-none opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}

          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onSelect('__OTHER__'); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-primary-600 hover:bg-primary-50 font-medium"
            >
              + Other (custom)...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
