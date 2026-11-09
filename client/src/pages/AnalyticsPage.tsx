import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  BarChart3,
  PieChart,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Users
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.get('/analytics/overview');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load governance analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Aggregating governance records...</div>;
  }

  const categories = data?.categories || [];
  const severities = data?.severities || [];
  const repeated = data?.repeatedViolations || [];
  const gaps = data?.guidelineGaps || [];
  const reviewerActivity = data?.reviewerActivity || [];

  const maxCatCount = Math.max(...categories.map((c: any) => c.count), 1);
  const maxSevCount = Math.max(...severities.map((s: any) => s.count), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Governance Analytics & Quality Audits</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Live Relational Telemetry
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empirical quality benchmarks, repeated brand slip-ups, reviewer throughput, and detected guideline gaps.
          </p>
        </div>
      </div>

      {/* Top Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Violation Categories Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-brand-600 mr-1.5" />
              Violation Category Distribution
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Authoritative Database Counts</span>
          </div>

          <div className="space-y-3 pt-2">
            {categories.map((cat: any) => {
              const pct = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 capitalize">
                      {cat.category.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="font-bold text-slate-900">{cat.count} findings</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-brand-600 mr-1.5" />
              Severity Tier Breakdown
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Risk Level Weights</span>
          </div>

          <div className="space-y-3 pt-2">
            {severities.map((sev: any) => {
              const pct = Math.round((sev.count / maxSevCount) * 100);
              let barColor = 'bg-blue-500';
              if (sev.severity === 'CRITICAL') barColor = 'bg-rose-600';
              else if (sev.severity === 'HIGH') barColor = 'bg-amber-500';
              else if (sev.severity === 'MEDIUM') barColor = 'bg-yellow-500';

              return (
                <div key={sev.severity} className="space-y-1">
                  <div className="flex justify-between text-xs items-center">
                    <SeverityBadge severity={sev.severity} />
                    <span className="font-bold text-slate-900">{sev.count} incidents</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${barColor} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Repeated Terminology & Guideline Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Repeated Prohibited Phrases */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-rose-600 mr-1.5" />
              Top Repeated Prohibited Terminology
            </h2>
            <span className="text-[11px] text-slate-400">Recurring Errors</span>
          </div>

          <div className="divide-y divide-slate-100">
            {repeated.length > 0 ? (
              repeated.map((r: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <span className="font-bold text-rose-600">"{r.problematic_text}"</span>
                      <span className="text-[10px] text-slate-400 block capitalize">
                        {r.category.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={r.severity} />
                    <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                      {r.occurrence_count}x
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No repeated violations recorded.</p>
            )}
          </div>
        </div>

        {/* Guideline Gaps / Unverified Claims Detected */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-1.5" />
              Guideline Gaps (Unverified Claims)
            </h2>
            <span className="text-[11px] text-slate-400">Source Citations Needed</span>
          </div>

          <div className="space-y-3">
            {gaps.length > 0 ? (
              gaps.map((gap: any, i: number) => (
                <div key={i} className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>"{gap.problematic_text}"</span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 px-1.5 py-0.5 rounded bg-white">
                      Unverified Gap
                    </span>
                  </div>
                  <p className="text-amber-900 text-[11px]">{gap.explanation}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <FileCheck2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                All current marketing claims in the system are fully backed by approved sources!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
