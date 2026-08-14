'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, Search, UserCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCachedVerifications, setCachedVerifications } from '@/lib/adminCache';
import { useAdminSync } from '@/hooks/useAdminSync';

export default function AdminVerificationsPage() {
  const { showToast } = useApp();
  const cached = getCachedVerifications();
  const [verifications, setVerifications] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchVerifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/verifications');
      const data = await res.json();
      if (data.success && data.data) {
        setVerifications(data.data);
        setCachedVerifications(data.data);
      }
    } catch (err) {
      console.warn('Failed to load verifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cached) {
      fetchVerifications();
    }
  }, [cached, fetchVerifications]);

  // Real-time cross-tab and cross-browser sync hook
  useAdminSync({
    dataType: 'verifications',
    onSync: () => {
      const latest = getCachedVerifications();
      if (latest) {
        setVerifications(latest);
      } else {
        fetchVerifications(true);
      }
    },
    enablePolling: true,
    pollIntervalMs: 10000,
  });

  const handleAction = async (userId: string, email: string, action: 'approve' | 'reject') => {
    if (processingId) return;

    // Local pre-check: verify item hasn't already been actioned
    const targetItem = verifications.find(u => (u._id && u._id === userId) || u.email === email);
    if (targetItem && targetItem.verificationStatus !== 'pending') {
      showToast(`This request was already ${targetItem.verificationStatus.toUpperCase()}. Action canceled.`);
      return;
    }

    setProcessingId(userId);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, action })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message);
        setVerifications(prev => {
          const updated = prev.map(u => {
            if ((u._id && u._id === userId) || u.email === email) {
              return {
                ...u,
                ownerVerified: action === 'approve',
                verificationStatus: action === 'approve' ? 'approved' : 'rejected'
              };
            }
            return u;
          });
          setCachedVerifications(updated);
          return updated;
        });
      } else {
        // Handle 409 conflict or duplicate action attempt gracefully
        const actualStatus = data.verificationStatus || data.user?.verificationStatus;
        if (actualStatus) {
          setVerifications(prev => {
            const updated = prev.map(u => {
              if ((u._id && u._id === userId) || u.email === email) {
                return {
                  ...u,
                  ownerVerified: actualStatus === 'approved',
                  verificationStatus: actualStatus
                };
              }
              return u;
            });
            setCachedVerifications(updated);
            return updated;
          });
        }
        showToast(data.message || 'Action could not be performed.');
      }
    } catch (e) {
      showToast('Network error processing request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDocument = (documentUrl: string) => {
    try {
      if (documentUrl.startsWith('data:')) {
        const separatorIndex = documentUrl.indexOf(',');
        if (separatorIndex === -1) throw new Error('Invalid document data');

        const mimeType = documentUrl.slice(5, separatorIndex).split(';')[0];
        const bytes = Uint8Array.from(atob(documentUrl.slice(separatorIndex + 1)), (character) => character.charCodeAt(0));
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
        const previewWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

        if (!previewWindow) {
          URL.revokeObjectURL(blobUrl);
          showToast('Allow pop-ups to view this document.');
          return;
        }

        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
        return;
      }

      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    } catch {
      showToast('This document could not be opened. Ask the owner to upload it again.');
    }
  };

  const filtered = verifications.filter(v => {
    if (statusFilter !== 'all' && v.verificationStatus !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        v.name?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.consumerNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = verifications.filter(v => v.verificationStatus === 'pending').length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-emerald-950/80 pb-4 sm:pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">Owner Verification Queue</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold shadow animate-pulse whitespace-nowrap">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 max-w-xs sm:max-w-none">Review Electricity Bills & approve verified property owners</p>
        </div>

        <button
          onClick={() => fetchVerifications(false)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#091a12] border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 rounded-full text-xs font-bold transition-all cursor-pointer self-start sm:self-auto w-full sm:w-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="grid grid-cols-2 sm:flex items-stretch gap-2 bg-[#080d0a] p-1.5 rounded-2xl border border-emerald-950 w-full sm:w-auto">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase transition-all tracking-wider capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, consumer no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#080d0a] border border-emerald-950 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Verifications List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-400" />
          Loading Electricity Bill submissions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0a110d] rounded-3xl border border-emerald-950 p-8 sm:p-12 text-center space-y-3">
          <UserCheck size={36} className="mx-auto text-emerald-900/60" />
          <h3 className="text-base font-bold text-white">No Verification Requests Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">There are no property owner electricity bill submissions matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div
              key={item._id || item.email}
              className="bg-[#0a110d] border border-emerald-950/90 rounded-3xl p-4 sm:p-5 lg:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 font-extrabold flex items-center justify-center text-sm shrink-0">
                    {item.name?.charAt(0) || 'O'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[11rem] sm:max-w-none">{item.name}</h3>
                      {item.verificationStatus === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 whitespace-nowrap">
                          <CheckCircle2 size={10} />
                          <span>VERIFIED OWNER</span>
                        </span>
                      )}
                      {item.verificationStatus === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 whitespace-nowrap">
                          <Clock size={10} />
                          <span>PENDING REVIEW</span>
                        </span>
                      )}
                      {item.verificationStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 whitespace-nowrap">
                          <XCircle size={10} />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-400 break-words">{item.email} • {item.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 sm:pt-2 text-xs">
                  <div className="bg-[#050806] p-3 rounded-2xl border border-emerald-950">
                    <span className="text-gray-500 font-medium block">Consumer / CA Number</span>
                    <span className="font-mono font-bold text-emerald-400 text-[13px] sm:text-sm break-all">{item.consumerNumber || 'Not provided'}</span>
                  </div>
                  <div className="bg-[#050806] p-3 rounded-2xl border border-emerald-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-gray-500 font-medium block">Electricity Bill</span>
                      <span className="text-gray-300 font-bold text-sm sm:text-xs">Document Attached</span>
                    </div>
                    {item.electricityBillUrl && (
                      <button
                        type="button"
                        onClick={() => handleViewDocument(item.electricityBillUrl)}
                        className="px-3 py-2 bg-[#0e2418] hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/80 rounded-xl text-[11px] font-bold inline-flex items-center justify-center space-x-1 transition-all w-full sm:w-auto"
                      >
                        <span>View Document</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="w-full lg:w-48 shrink-0 rounded-2xl border border-emerald-950 bg-[#07110b] p-2.5 flex flex-col justify-center gap-2">
                {item.verificationStatus === 'approved' ? (
                  <button
                    disabled
                    className="w-full h-11 px-4 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approved</span>
                  </button>
                ) : item.verificationStatus === 'rejected' ? (
                  <button
                    disabled
                    className="w-full h-11 px-4 bg-red-950/60 border border-red-800/40 text-red-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                  >
                    <XCircle size={14} />
                    <span>Rejected</span>
                  </button>
                ) : (
                  <>
                    <button
                      disabled={Boolean(processingId)}
                      onClick={() => handleAction(item._id || item.id, item.email, 'approve')}
                      className="w-full h-11 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-extrabold text-xs rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07110b] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={15} />
                      <span>{processingId === (item._id || item.id) ? 'Processing...' : 'Approve owner'}</span>
                    </button>
                    <button
                      disabled={Boolean(processingId)}
                      onClick={() => handleAction(item._id || item.id, item.email, 'reject')}
                      className="w-full h-10 px-4 bg-transparent hover:bg-red-950/50 active:scale-[0.98] text-red-400 hover:text-red-300 border border-red-900/70 hover:border-red-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07110b] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={15} />
                      <span>Reject request</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
