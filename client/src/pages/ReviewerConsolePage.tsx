import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { Modal } from '../components/Modal';
import {
  CheckCircle,
  XCircle,
  AlertOctagon,
  ArrowUpRight,
  MessageSquare,
  ShieldAlert,
  Send,
  User,
  ExternalLink,
  History,
  FileCheck2
} from 'lucide-react';

export const ReviewerConsolePage: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [submissionDetail, setSubmissionDetail] = useState<any | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState('');

  // Decision Modal state
  const [decisionType, setDecisionType] = useState<
    'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES' | 'ESCALATED' | null
  >(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load Review Queue
  const loadQueue = async () => {
    try {
      const res = await api.get('/reviews/queue');
      const items = res.data.queue || [];
      setQueue(items);
      if (items.length > 0 && !selectedSubmissionId) {
        setSelectedSubmissionId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // Load selected submission detail
  useEffect(() => {
    if (!selectedSubmissionId) return;

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const res = await api.get(`/content/${selectedSubmissionId}`);
        setSubmissionDetail(res.data);
      } catch (err) {
        console.error('Failed to load submission details:', err);
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
  }, [selectedSubmissionId]);

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId || !newComment.trim()) return;

    try {
      await api.post(`/reviews/${selectedSubmissionId}/comment`, { commentText: newComment });
      setNewComment('');
      // Reload detail
      const res = await api.get(`/content/${selectedSubmissionId}`);
      setSubmissionDetail(res.data);
    } catch (err: any) {
      alert(`Failed to add comment: ${err.response?.data?.error || err.message}`);
    }
  };

  // Open Decision Modal
  const openDecisionDialog = (type: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES' | 'ESCALATED') => {
    setDecisionType(type);
    setDecisionReason(
      type === 'APPROVED' ? 'Full brand compliance verified against approved brand truth.' : ''
    );
    setIsDecisionModalOpen(true);
  };

  // Execute Decision
  const handleExecuteDecision = async () => {
    if (!selectedSubmissionId || !decisionType) return;

    if (decisionType !== 'APPROVED' && !decisionReason.trim()) {
      alert('A justification reason is mandatory for rejections, change requests, or escalations.');
      return;
    }

    try {
      if (decisionType === 'APPROVED') {
        await api.post(`/reviews/${selectedSubmissionId}/approve`, { reason: decisionReason });
      } else if (decisionType === 'REJECTED') {
        await api.post(`/reviews/${selectedSubmissionId}/reject`, { reason: decisionReason });
      } else if (decisionType === 'REQUEST_CHANGES') {
        await api.post(`/reviews/${selectedSubmissionId}/request-changes`, { reason: decisionReason });
      } else if (decisionType === 'ESCALATED') {
        await api.post(`/reviews/${selectedSubmissionId}/escalate`, { reason: decisionReason });
      }

      setIsDecisionModalOpen(false);
      loadQueue();
      // Reload current detail
      const res = await api.get(`/content/${selectedSubmissionId}`);
      setSubmissionDetail(res.data);
    } catch (err: any) {
      alert(`Decision recording failed: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading Review Queue...</div>;
  }

  const sub = submissionDetail?.submission;
  const versions = submissionDetail?.versions || [];
  const latestFindings = submissionDetail?.latestFindings || [];
  const comments = submissionDetail?.comments || [];
  const decisions = submissionDetail?.decisions || [];

  const currentVer = versions.find((v: any) => v.version_number === sub?.current_version);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Human Reviewer Console</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              Human Stewardship Gate
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative pre-publication review queue. Inspect AI findings, ground evidence, and execute final approval decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <span>Active Reviewer:</span>
          <span className="text-slate-900">{user?.fullName}</span>
        </div>
      </div>

      {/* Main Reviewer Layout: 2 Columns (Queue on Left, Detail & Actions on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Review Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pending Queue ({queue.length})
            </h2>
            <button
              onClick={loadQueue}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
            {queue.map((item) => {
              const isSelected = selectedSubmissionId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSubmissionId(item.id)}
                  className={`p-4 cursor-pointer transition-all space-y-2 ${
                    isSelected ? 'bg-brand-50/50 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{item.title}</p>
                    <StatusBadge status={item.current_status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.creator_name}</span>
                    <span className="uppercase font-semibold text-[10px] text-slate-400">
                      {item.channel} • v{item.current_version}
                    </span>
                  </div>

                  {item.critical_findings > 0 && (
                    <div className="flex items-center text-[10px] font-bold text-rose-600">
                      <ShieldAlert className="w-3 h-3 mr-1" />
                      {item.critical_findings} Critical Violations
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Submission Inspection, Findings & Decision Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {detailLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading submission details...</div>
          ) : sub ? (
            <>
              {/* Submission Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {sub.channel}
                      </span>
                      <span>•</span>
                      <span className="text-xs font-semibold text-brand-600">
                        Version {sub.current_version}
                      </span>
                      <span>•</span>
                      <StatusBadge status={sub.current_status} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{sub.title}</h2>
                    <p className="text-xs text-slate-500">
                      Authored by <strong className="text-slate-700">{sub.creator_name}</strong> • Target Persona: <strong className="text-slate-700">{sub.target_audience}</strong>
                    </p>
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDecisionDialog('APPROVED')}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionDialog('REQUEST_CHANGES')}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <AlertOctagon className="w-3.5 h-3.5 mr-1.5" />
                      Request Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionDialog('REJECTED')}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionDialog('ESCALATED')}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Escalate
                    </button>
                  </div>
                </div>

                {/* Submitted Content Body */}
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Content Body Text (v{sub.current_version})
                  </h3>
                  <p className="text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                    {currentVer?.body_text || 'No content found.'}
                  </p>
                </div>
              </div>

              {/* AI Governance Findings & Evidence Citation Panel */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>AI Preflight Findings & Grounded Sources</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {latestFindings.length} Total Findings
                  </span>
                </h3>

                <div className="space-y-3">
                  {latestFindings.map((finding: any) => (
                    <div
                      key={finding.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white space-y-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <SeverityBadge severity={finding.severity} />
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              {finding.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">
                            Problematic Phrase: "{finding.problematic_text}"
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {finding.explanation}
                      </p>

                      {/* Evidence Reference */}
                      {finding.source_excerpt && (
                        <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs space-y-1 text-blue-950">
                          <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                            <span>Authoritative Source: {finding.source_id} (v{finding.source_version})</span>
                            <span className="uppercase text-[10px]">{finding.confidence_level}</span>
                          </div>
                          <p className="italic bg-white/70 p-2 rounded border border-blue-100">
                            "{finding.source_excerpt}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Comments & Decisions Thread */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" />
                  <span>Review Comments & Decision Audit</span>
                </h3>

                {/* Previous Decisions */}
                {decisions.length > 0 && (
                  <div className="space-y-2">
                    {decisions.map((dec: any) => (
                      <div
                        key={dec.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-900">
                            Decision: <strong>{dec.decision}</strong> by {dec.reviewer_name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(dec.decided_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 italic">"{dec.reason}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment stream */}
                <div className="space-y-3">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex space-x-3 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {comment.author_name.charAt(0)}
                      </div>
                      <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>{comment.author_name} ({comment.author_role.replace(/_/g, ' ').toLowerCase()})</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700">{comment.comment_text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment input */}
                <form onSubmit={handleAddComment} className="flex space-x-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add an internal reviewer note or feedback for creator..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Post Note
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a submission from the pending queue to inspect.
            </div>
          )}
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={`Execute Decision: ${decisionType}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Record authoritative human reviewer decision for "{sub?.title}". This decision is immutably logged in the audit trail.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reviewer Notes / Reason {decisionType !== 'APPROVED' ? '(Required)' : '(Optional)'}
            </label>
            <textarea
              rows={4}
              required={decisionType !== 'APPROVED'}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="State clear reasons or required revisions before publication."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteDecision}
              className={`px-4 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs ${
                decisionType === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : decisionType === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              Confirm Decision
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

