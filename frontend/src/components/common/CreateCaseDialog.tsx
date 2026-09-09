import React, { useState, useEffect } from 'react';
import { X, Briefcase, AlertCircle, Check } from 'lucide-react';
import { createCase } from '../../services/api';
import { Case } from '../../types';

interface CreateCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetEntity?: string;
  initialTitle?: string;
  leadId?: string;
  onCaseCreated: (newCase: Case) => void;
}

export const CreateCaseDialog: React.FC<CreateCaseDialogProps> = ({
  isOpen,
  onClose,
  targetEntity = '',
  initialTitle = '',
  leadId,
  onCaseCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [status, setStatus] = useState('OPEN');
  const [target, setTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || (targetEntity ? `Investigation: ${targetEntity.slice(0, 16)}...` : ''));
      setTarget(targetEntity || '');
      setDescription(leadId ? `Case established from Lead ${leadId}` : 'Forensic investigation docket.');
      setNotes('Initial evidence collected from BitTrace forensic data ingestion engine.');
      setError('');
    }
  }, [isOpen, targetEntity, initialTitle, leadId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !target.trim()) {
      setError('Title and Target Entity are required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const newCase = await createCase({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        target_entity: target.trim(),
        lead_id: leadId,
        investigator_notes: notes.trim(),
      });
      onCaseCreated(newCase);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to establish case docket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-soc-950 border border-soc-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-soc-800 bg-soc-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-soc-800 text-cyan-400 border border-soc-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Open Forensic Case Docket</h2>
              <span className="text-[10px] font-mono text-soc-400">NTRO CYBER INTELLIGENCE SYSTEM</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-soc-400 hover:text-white rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-md text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-soc-300 font-medium mb-1">Case Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Operation PeelChain Node 04"
              className="soc-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-soc-300 font-medium mb-1">Target Entity / Identifier *</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., bc1q9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4h3g2f1"
              className="soc-input w-full font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-soc-300 font-medium mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="soc-input w-full"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-soc-300 font-medium mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="soc-input w-full"
              >
                <option value="OPEN">OPEN</option>
                <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                <option value="ESCALATED">ESCALATED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-soc-300 font-medium mb-1">Executive Scope & Summary</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="soc-input w-full"
              placeholder="Brief investigative rationale..."
            />
          </div>

          <div>
            <label className="block text-soc-300 font-medium mb-1">Investigator Working Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="soc-input w-full"
              placeholder="Add key observations, suspected typologies, or subpoena links..."
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-soc-800 hover:bg-soc-700 text-soc-300 hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Docket...' : 'Create Case Docket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
