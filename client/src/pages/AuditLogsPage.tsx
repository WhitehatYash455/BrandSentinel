import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { History, Shield, Filter, Search, ArrowRight, Eye } from 'lucide-react';
import { Modal } from '../components/Modal';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = async () => {
    try {
      const res = await api.get('/audit-logs?limit=100');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchAction) return true;
    return (
      log.action.toLowerCase().includes(searchAction.toLowerCase()) ||
      log.content_title?.toLowerCase().includes(searchAction.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchAction.toLowerCase())
    );
  });

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading Immutable Audit Trail...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Immutable Governance Audit Trail</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Tamper-Proof Log
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete cryptographic audit log of all content modifications, AI scans, reviewer approvals, and override justifications.
          </p>
        </div>

        {/* Filter input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            placeholder="Search action, title, or user..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                Timestamp (UTC)
              </th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                Actor / User
              </th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                Action Executed
              </th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                Associated Content Asset
              </th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-700 uppercase tracking-wider">
                Status Transition
              </th>
              <th className="px-6 py-3.5 text-right font-bold text-slate-700 uppercase tracking-wider">
                Payload
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-3 font-semibold text-slate-900 whitespace-nowrap">
                  {log.user_name || 'System / Engine'}
                  {log.user_role && (
                    <span className="block text-[10px] font-normal text-slate-400 capitalize">
                      {log.user_role.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide uppercase bg-slate-100 text-slate-800 border border-slate-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-800 max-w-xs truncate font-medium">
                  {log.content_title || log.content_id || 'Global Workspace'}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {log.new_status ? (
                    <div className="flex items-center space-x-1 text-[11px]">
                      <span className="text-slate-400">{log.previous_status || 'INIT'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-900">{log.new_status}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  {log.metadata_json && (
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                      title="Inspect Log Payload"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metadata Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Record Details: ${selectedLog?.action}`}
      >
        <div className="space-y-3">
          <div className="text-xs space-y-1 text-slate-600">
            <p><strong>Log ID:</strong> <span className="font-mono">{selectedLog?.id}</span></p>
            <p><strong>Actor:</strong> {selectedLog?.user_name} ({selectedLog?.user_role || 'System'})</p>
            <p><strong>Recorded At:</strong> {selectedLog?.created_at}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Metadata JSON Payload
            </label>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
              {JSON.stringify(JSON.parse(selectedLog?.metadata_json || '{}'), null, 2)}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};

