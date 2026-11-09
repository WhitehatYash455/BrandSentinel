import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PenTool,
  CheckCircle2,
  BookOpen,
  BarChart3,
  History,
  Settings,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    {
      to: '/',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN']
    },
    {
      to: '/creator',
      label: 'Creator Workspace',
      icon: PenTool,
      roles: ['CONTENT_CREATOR', 'BRAND_ADMIN']
    },
    {
      to: '/reviewer',
      label: 'Reviewer Console',
      icon: CheckCircle2,
      roles: ['HUMAN_REVIEWER', 'BRAND_ADMIN'],
      badge: 'Queue'
    },
    {
      to: '/knowledge',
      label: 'Brand Knowledge',
      icon: BookOpen,
      roles: ['BRAND_ADMIN', 'HUMAN_REVIEWER']
    },
    {
      to: '/analytics',
      label: 'Governance Analytics',
      icon: BarChart3,
      roles: ['CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN']
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: History,
      roles: ['CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN']
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      roles: ['CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN']
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-61px)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800/80">
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Brand</p>
          <p className="text-sm font-bold text-white truncate mt-0.5">Vajra Sentinel</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Governance Active (v2.1)
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter(item => !role || item.roles.includes(role))
          .map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-brand-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Core Principle Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-slate-200">Brand Truth Mandate</p>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
              Every Piece of Content. One Approved Brand Truth. Human Stewarded.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
