import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { Modal } from '../components/Modal';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Edit3,
  ExternalLink,
  RotateCcw,
  Send,
  FileCheck2,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { Finding, Submission, ContentVersion } from '../types';

export const InspectionStudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);

  // Filter state
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Dismiss modal state
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissingFinding, setDismissingFinding] = useState<Finding | null>(null);

  // Edit suggestion modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customSuggestionText, setCustomSuggestionText] = useState('');

  // Resubmit revised copy modal state
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [revisedContentText, setRevisedContentText] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  const [loading, setLoading] = useState(true);

  // Load submission detail and scan results
  const loadData = async () => {
    try {
      const res = await api.get(`/content/${id}`);
      const sub = res.data.submission;
      setSubmission(sub);
      setVersions(res.data.versions || []);
      setSelectedVersion(sub.current_version);
      setFindings(res.data.latestFindings || []);

      const currentVerObj = (res.data.versions || []).find(
        (v: any) => v.version_number === sub.current_version
      );
      if (currentVerObj) {
        setRevisedContentText(currentVerObj.body_text);
      }

      if (res.data.latestFindings?.length > 0) {
        setActiveFinding(res.data.latestFindings[0]);
      }
    } catch (err) {
      console.error('Failed to load inspection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Current version body text
  const currentVersionData = versions.find((v) => v.version_number === selectedVersion);
  const bodyText = currentVersionData?.body_text || '';

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    return true;
  });

  // Accept Suggestion
  const handleAcceptSuggestion = async (finding: Finding) => {
    if (!finding.suggestion_id) return;
    try {
      await api.post(`/suggestions/${finding.suggestion_id}/accept`);

      // Update in-place in text
      if (finding.suggested_text && revisedContentText.includes(finding.problematic_text)) {
        setRevisedContentText(
          revisedContentText.replace(finding.problematic_text, finding.suggested_text)
        );
      }

      loadData();
    } catch (err: any) {
      alert(`Failed to accept suggestion: ${err.response?.data?.error || err.message}`);
    }
  };

  // Open Dismiss Modal
  const openDismissModal = (finding: Finding) => {
    setDismissingFinding(finding);
    setDismissReason('');
    setIsDismissModalOpen(true);
  };

  // Submit Dismissal
  const handleConfirmDismiss = async () => {
    if (!dismissingFinding?.suggestion_id || !dismissReason.trim()) {
      alert('A valid reason is required to dismiss a brand governance suggestion.');
      return;
    }

    try {
      await api.post(`/suggestions/${dismissingFinding.suggestion_id}/dismiss`, {
        reason: dismissReason
      });
      setIsDismissModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Dismissal failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // Open Edit Suggestion Modal
  const openEditModal = (finding: Finding) => {
    setActiveFinding(finding);
    setCustomSuggestionText(finding.suggested_text || finding.problematic_text);
    setIsEditModalOpen(true);
  };

  // Save Custom Suggestion
  const handleSaveCustomSuggestion = async () => {
    if (!activeFinding?.suggestion_id) return;
    try {
      await api.post(`/suggestions/${activeFinding.suggestion_id}/edit`, {
        customText: customSuggestionText
      });
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Failed to update suggestion: ${err.response?.data?.error || err.message}`);
    }
  };

  // Submit Revised Version (N+1)
  const handleResubmitRevision = async () => {
    if (!revisedContentText.trim()) return;

    try {
      await api.post(`/content/${id}/resubmit`, {
        revisedBodyText: revisedContentText,
        changeSummary: changeSummary || 'Applied AI correction suggestions'
      });
      setIsResubmitModalOpen(false);

      // Re-trigger scan for new version
      await api.post('/scans/run', { submissionId: id });
      loadData();
    } catch (err: any) {
      alert(`Failed to submit revision: ${err.response?.data?.error || err.message}`);
    }
  };

  // Submit for Human Review
  const handleSubmitForReview = async () => {
    try {
      await api.post(`/content/${id}/submit`);
      loadData();
      alert('Content successfully submitted to Human Reviewer queue!');
    } catch (err: any) {
      alert(`Submit failed: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading AI findings and evidence citations...
      </div>
    );
  }

  if (!submission) {
    return <div className="p-12 text-center text-slate-500">Submission not found.</div>;
  }

  // Calculate score from findings
  const openCritical = findings.filter((f) => f.severity === 'CRITICAL' && f.status === 'OPEN').length;
  const openHigh = findings.filter((f) => f.severity === 'HIGH' && f.status === 'OPEN').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inspection Studio
            </span>
            <span>•</span>
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              {submission.channel}
            </span>
            <span>•</span>
            <StatusBadge status={submission.current_status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{submission.title}</h1>
        </div>

        {/* Version selector & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Version:</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            >
              {versions.map((v) => (
                <option key={v.version_number} value={v.version_number}>
                  v{v.version_number} ({new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsResubmitModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Create Revised Version
          </button>

          {submission.current_status !== 'APPROVED' && submission.current_status !== 'IN_REVIEW' && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 shadow-md shadow-brand-500/20"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Submit to Human Reviewer
            </button>
          )}
        </div>
      </div>

      {/* Summary Score Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3 p-2">
          <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Compliance Health</p>
            <p className="text-xl font-bold text-slate-900">
              {openCritical === 0 && openHigh === 0 ? 'Pass (95+)' : openCritical > 0 ? 'Critical Risk' : 'Needs Review'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-2 border-l border-slate-100">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Critical Findings</p>
            <p className="text-xl font-bold text-rose-600">{openCritical}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-2 border-l border-slate-100">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">High / Medium Issues</p>
            <p className="text-xl font-bold text-amber-600">{openHigh}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-2 border-l border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Grounded Citations</p>
            <p className="text-xl font-bold text-emerald-600">{findings.length}</p>
          </div>
        </div>
      </div>

      {/* Main Studio: Split View (Content vs Findings & Evidence) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submitted Text with Highlights (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Submitted Content (v{selectedVersion})
            </h2>
            <span className="text-xs text-slate-400">Click any highlighted text to inspect evidence</span>
          </div>

          <div className="p-6">
            <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
              {/* Highlight rendered content */}
              {bodyText.split(/\b/).map((chunk, i) => {
                const matchFinding = findings.find(
                  (f) => f.problematic_text.toLowerCase() === chunk.toLowerCase()
                );
                if (matchFinding) {
                  const isActive = activeFinding?.id === matchFinding.id;
                  let highlightClass = 'highlight-medium';
                  if (matchFinding.severity === 'CRITICAL') highlightClass = 'highlight-critical';
                  else if (matchFinding.severity === 'HIGH') highlightClass = 'highlight-high';
                  else if (matchFinding.severity === 'LOW') highlightClass = 'highlight-low';

                  return (
                    <span
                      key={i}
                      onClick={() => setActiveFinding(matchFinding)}
                      className={`${highlightClass} ${isActive ? 'highlight-active font-bold' : ''}`}
                      title={`${matchFinding.category}: ${matchFinding.explanation}`}
                    >
                      {chunk}
                    </span>
                  );
                }
                return <span key={i}>{chunk}</span>;
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Findings, Evidence Grounding & Correction Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Findings Filter Bar */}
          <div className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium">Filter:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="TERMINOLOGY">Terminology</option>
              <option value="BRAND_VOICE">Brand Voice</option>
              <option value="UNSUPPORTED_CLAIM">Unsupported Claim</option>
              <option value="ACCESSIBILITY">Accessibility</option>
            </select>
          </div>

          {/* Active Finding Inspection Card */}
          {activeFinding ? (
            <div className="bg-white rounded-xl border-2 border-brand-500 shadow-md p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={activeFinding.severity} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {activeFinding.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    "{activeFinding.problematic_text}"
                  </p>
                </div>
              </div>

              {/* Problem Explanation */}
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed border border-slate-100">
                <span className="font-semibold text-slate-900">Governance Finding: </span>
                {activeFinding.explanation}
              </div>

              {/* Grounded Evidence Citation Panel */}
              <div className="p-3.5 bg-blue-50/70 rounded-lg border border-blue-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 flex items-center">
                    <ExternalLink className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Supporting Evidence Citation
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-blue-700 border border-blue-200">
                    Source: {activeFinding.source_id || 'N/A'} (v{activeFinding.source_version || '1.0'})
                  </span>
                </div>
                <p className="text-xs text-blue-950 font-medium italic bg-white/70 p-2 rounded border border-blue-100">
                  "{activeFinding.source_excerpt || 'Not verified — approved supporting evidence not found.'}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-blue-800">
                  <span>Confidence: <strong className="uppercase">{activeFinding.confidence_level || 'HIGH'}</strong></span>
                  <span>Grounding: Authoritative Approved Truth</span>
                </div>
              </div>

              {/* Correction Suggestion Pill */}
              {activeFinding.suggested_text && (
                <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900 flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Suggested Alternative
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                      Preserves Intent
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-emerald-100 text-xs font-semibold text-emerald-950">
                    {activeFinding.suggested_text}
                  </div>

                  {activeFinding.suggestion_reason && (
                    <p className="text-[11px] text-emerald-800">
                      Rationale: {activeFinding.suggestion_reason}
                    </p>
                  )}

                  {/* Suggestion Action Buttons */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAcceptSuggestion(activeFinding)}
                      className="flex-1 inline-flex items-center justify-center py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Accept
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(activeFinding)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 inline" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => openDismissModal(activeFinding)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              Select a finding from the list below to inspect evidence citations.
            </div>
          )}

          {/* All Findings Accordion List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 bg-slate-50/50 text-xs font-bold text-slate-600 uppercase tracking-wider flex justify-between">
              <span>All Findings ({filteredFindings.length})</span>
            </div>

            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                onClick={() => setActiveFinding(finding)}
                className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors space-y-1.5 ${
                  activeFinding?.id === finding.id ? 'bg-brand-50/40 border-l-4 border-brand-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    "{finding.problematic_text}"
                  </span>
                  <SeverityBadge severity={finding.severity} />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{finding.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dismiss Justification Modal */}
      <Modal
        isOpen={isDismissModalOpen}
        onClose={() => setIsDismissModalOpen(false)}
        title="Dismiss AI Suggestion Justification"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enterprise governance mandates recording an audit reason when dismissing an automated brand
            suggestion for "{dismissingFinding?.problematic_text}".
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Justification Reason (Required)
            </label>
            <textarea
              rows={3}
              required
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="e.g. Authorized exception approved by General Counsel for specific partner co-marketing collateral."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDismissModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDismiss}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Confirm Dismissal
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Suggestion Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Correction Replacement"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Custom Replacement Text
            </label>
            <input
              type="text"
              value={customSuggestionText}
              onChange={(e) => setCustomSuggestionText(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900 font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomSuggestion}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Save Custom Wording
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Revised Version Modal */}
      <Modal
        isOpen={isResubmitModalOpen}
        onClose={() => setIsResubmitModalOpen(false)}
        title={`Create Revised Version (v${submission.current_version + 1})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Revision Changelog Summary
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g. Corrected SLA metrics and removed prohibited security terminology"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Revised Body Content
            </label>
            <textarea
              rows={10}
              value={revisedContentText}
              onChange={(e) => setRevisedContentText(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-slate-900 font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResubmitModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResubmitRevision}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Save & Scan Revision v{submission.current_version + 1}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
