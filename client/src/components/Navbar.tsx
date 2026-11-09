import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-900 text-brand-400 shadow-md">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">BRAND SENTINEL</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Team Vajra | CodeTitan 2026</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-4">
          {/* Quick Demo Switcher */}
          <RoleSwitcher />

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-900 leading-none">{user?.fullName}</p>
              <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                {user?.role?.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

