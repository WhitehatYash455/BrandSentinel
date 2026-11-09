import React from 'react';
import { SubmissionStatus } from '../types';

interface StatusBadgeProps {
  status: SubmissionStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_REVIEW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CHANGES_REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ESCALATED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SCANNED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'IN_SCAN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 animate-pulse';
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLabel = () => {
    return status.replace(/_/g, ' ');
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium border rounded-full capitalize ${pad} ${getStyles()}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {getLabel()}
    </span>
  );
};

