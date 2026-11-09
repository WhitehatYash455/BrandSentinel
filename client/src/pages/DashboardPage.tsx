import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertOctagon,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/analytics/overview');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-slate-500 text-sm">
          <svg className="animate-spin h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Loading governance metrics...</span>
        </div>
      </div>
    );
  }

  const counts = analytics?.counts || {};

  const kpis = [
    {
      title: 'Total Submissions',
      value: counts.TOTAL || 0,
      icon: FileText,
      color: 'text-brand-600 bg-brand-50 border-brand-200'
    },
    {
      title: 'In Review Queue',
      value: counts.IN_REVIEW || 0,
      icon: Clock,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      title: 'Approved Content',
      value: counts.APPROVED || 0,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Revisions Requested',
      value: counts.CHANGES_REQUESTED || 0,
      icon: AlertOctagon,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Open Critical Violations',
      value: analytics?.criticalFindingsCount || 0,
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome header & quick actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Governance Command</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time pre-publication brand compliance status for <span className="font-semibold text-slate-700">Vajra Sentinel Enterprise</span>.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user?.role !== 'HUMAN_REVIEWER' && (
            <Link
              to="/creator"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Content Draft
            </Link>
          )}
          {user?.role !== 'CONTENT_CREATOR' && (
            <Link
              to="/reviewer"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              Reviewer Console
              <ArrowUpRight className="w-4 h-4 ml-1.5 text-slate-400" />
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</span>
                <span className="text-[11px] font-medium text-slate-400">Live DB</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Recent Submissions & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Content Submissions</h2>
            </div>
            <Link to="/creator" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View All Content →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics?.recentSubmissions?.length > 0 ? (
              analytics.recentSubmissions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1 max-w-md">
                    <Link
                      to={`/inspection/${sub.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-brand-600 truncate block"
                    >
                      {sub.title}
                    </Link>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">{sub.creator_name || 'Creator'}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] tracking-wider font-semibold text-slate-400">
                        {sub.channel}
                      </span>
                      <span>•</span>
                      <span>v{sub.current_version}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <StatusBadge status={sub.current_status} size="sm" />
                    <Link
                      to={`/inspection/${sub.id}`}
                      className="text-xs font-medium text-slate-400 hover:text-brand-600 p-1"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No recent submissions found.</div>
            )}
          </div>
        </div>

        {/* Violation Severity & Categories (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-brand-600 mr-1.5" />
                Violation Categories
              </h2>
              <Link to="/analytics" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Analytics →
              </Link>
            </div>

            <div className="space-y-3">
              {analytics?.categories?.slice(0, 5).map((cat: any) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 capitalize">
                      {cat.category.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="font-semibold text-slate-900">{cat.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, cat.count * 12)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Revision Velocity Metric
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Avg Revisions per Asset:</span>
                <span className="font-bold text-slate-900">{analytics?.revisionStats?.avgVersions || 1} versions</span>
              </div>
              <div className="flex justify-between">
                <span>Max Versions on 1 Asset:</span>
                <span className="font-bold text-slate-900">{analytics?.revisionStats?.maxVersions || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

