import { useState, useEffect, useRef, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomDropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value?: string;
  options: (string | CustomDropdownOption)[];
  onChange: (value: string) => void;
  onRemove?: (value: string) => void;
  onCustomAdd?: () => void;
  placeholder?: string;
  customLabel?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Filter mode — hides the × per item and + Other (custom) footer */
  noCustom?: boolean;
}

export const CustomDropdown = forwardRef<HTMLDivElement, CustomDropdownProps>(
  (
    {
      value = '',
      options,
      onChange,
      onRemove,
      onCustomAdd,
      placeholder = 'Select...',
      customLabel = '+ Other (custom)...',
      className = '',
      disabled = false,
      size = 'sm',
      noCustom = false,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [customValue, setCustomValue] = useState('');
    const innerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = (ref as React.RefObject<HTMLDivElement>) || innerRef;

    useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownRef]);

    const normalizedOptions: CustomDropdownOption[] = options.map((o) =>
      typeof o === 'string' ? { value: o, label: o } : o
    );

    const selectedLabel =
      normalizedOptions.find((o) => o.value === value)?.label || value || placeholder;

    const baseBtn = size === 'md'
      ? 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-left flex items-center justify-between'
      : 'w-full border border-gray-200 rounded-md px-2 py-1 text-[11px] h-7 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-left flex items-center justify-between';

    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          className={`${baseBtn} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${value ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className={`${size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-gray-400 flex-shrink-0 ml-1`} />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-0.5 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {!customMode && (
              <>
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className="w-full px-2 py-1.5 text-left text-[11px] text-gray-400 hover:bg-gray-50"
                >
                  {placeholder}
                </button>

                {normalizedOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center justify-between px-2 py-1 hover:bg-gray-50 group"
                  >
                    <button
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      className={`text-left text-[11px] flex-1 truncate ${
                        value === opt.value ? 'text-primary-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                    {!noCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRemove) {
                            onRemove(opt.value);
                          } else {
                            onChange('');
                            setOpen(false);
                          }
                        }}
                        className="text-gray-300 hover:text-red-500 text-[10px] px-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {!noCustom && (
                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (onCustomAdd) {
                          onCustomAdd();
                          setOpen(false);
                        } else {
                          setCustomMode(true);
                          setCustomValue('');
                        }
                      }}
                      className="w-full px-2 py-1.5 text-left text-[11px] text-primary-600 hover:bg-primary-50 font-medium"
                    >
                      {customLabel}
                    </button>
                  </div>
                )}
              </>
            )}

            {customMode && (
              <div className="p-2 flex gap-1">
                <input
                  autoFocus
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = customValue.trim();
                      if (trimmed) { onChange(trimmed); setOpen(false); setCustomMode(false); }
                    }
                    if (e.key === 'Escape') { setCustomMode(false); }
                  }}
                  placeholder="Type custom value..."
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = customValue.trim();
                    if (trimmed) { onChange(trimmed); setOpen(false); setCustomMode(false); }
                  }}
                  className="px-2 py-1 bg-primary-600 text-white rounded text-[10px] font-medium hover:bg-primary-700 flex items-center"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="px-2 py-1 text-gray-400 hover:text-gray-600 text-[11px]"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

CustomDropdown.displayName = 'CustomDropdown';
