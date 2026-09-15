import React from "react";
import { FolderSearch } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = <FolderSearch className="w-8 h-8 text-slate-400" />,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-white border border-dashed border-slate-200 rounded-2xl my-2">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
