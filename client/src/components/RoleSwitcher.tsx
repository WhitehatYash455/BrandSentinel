import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();

  if (!user) return null;

  const roles: Array<{ role: UserRole; label: string; icon: any; color: string }> = [
    {
      role: 'CONTENT_CREATOR',
      label: 'Content Creator',
      icon: Sparkles,
      color: 'hover:border-blue-400'
    },
    {
      role: 'HUMAN_REVIEWER',
      label: 'Human Reviewer',
      icon: UserCheck,
      color: 'hover:border-purple-400'
    },
    {
      role: 'BRAND_ADMIN',
      label: 'Brand Administrator',
      icon: ShieldCheck,
      color: 'hover:border-emerald-400'
    }
  ];

  return (
    <div className="flex items-center space-x-1.5 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
      <span className="text-xs text-slate-400 font-medium mr-1 flex items-center">
        <Shield className="w-3.5 h-3.5 mr-1 text-brand-400" />
        Role:
      </span>
      {roles.map(({ role, label, icon: Icon }) => {
        const isActive = user.role === role;
        return (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={`Switch view to ${label}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
};
