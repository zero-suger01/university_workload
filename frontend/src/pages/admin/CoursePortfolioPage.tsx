import { Folder } from 'lucide-react';

export default function CoursePortfolioPage() {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2">
        <Folder className="w-5 h-5 text-primary-600" />
        <h1 className="text-xl font-bold text-gray-900">Course Portfolio</h1>
      </div>
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="text-center text-gray-400">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Course Portfolio</p>
          <p className="text-xs mt-1">This module is coming soon.</p>
        </div>
      </div>
    </div>
  );
}
