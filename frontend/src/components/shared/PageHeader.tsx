import React from 'react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // right-side slot (buttons, badges, etc.)
}

export function PageHeader({ icon, title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      {/* Left: icon + title + underline */}
      <div>
        <div className="flex items-center gap-3">
          {/* Icon box */}
          <div className="p-1.5 bg-primary-50 border border-primary-100 rounded-lg flex-shrink-0">
            <span className="[&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-primary-600 block">
              {icon}
            </span>
          </div>

          {/* Text */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Decorative underline */}
        <div className="flex items-center gap-1 mt-2 ml-0.5">
          <div className="h-0.5 w-10 bg-primary-500 rounded-full" />
          <div className="h-0.5 w-5 bg-primary-300 rounded-full" />
          <div className="h-0.5 w-2 bg-primary-100 rounded-full" />
        </div>
      </div>

      {/* Right slot */}
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

/** Lightweight variant for form/panel headers (e.g. "New Course", "Edit Course") */
export function FormHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <span className="w-1 h-6 bg-primary-500 rounded-full flex-shrink-0" />
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md p-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
