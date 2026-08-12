'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, Search, UserCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCachedVerifications, setCachedVerifications } from '@/lib/adminCache';

export default function AdminVerificationsPage() {
  const { showToast } = useApp();
  const cached = getCachedVerifications();
  const [verifications, setVerifications] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchVerifications = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cached) {
      fetchVerifications();
    }
  }, []);

  const handleAction = async (userId: string, email: string, action: 'approve' | 'reject') => {
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
        showToast(data.message || 'Action failed');
      }

    } catch (e) {
      showToast('Network error processing request');
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Owner Verification Queue</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-xs font-extrabold shadow animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Review Electricity Bills & approve verified property owners</p>
        </div>

        <button
          onClick={fetchVerifications}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#091a12] border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 rounded-full text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-[#080d0a] p-1.5 rounded-2xl border border-emerald-950 w-full sm:w-auto">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all tracking-wider capitalize ${
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
            className="w-full pl-9 pr-4 py-2 bg-[#080d0a] border border-emerald-950 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
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
        <div className="bg-[#0a110d] rounded-3xl border border-emerald-950 p-12 text-center space-y-3">
          <UserCheck size={36} className="mx-auto text-emerald-900/60" />
          <h3 className="text-base font-bold text-white">No Verification Requests Found</h3>
          <p className="text-xs text-gray-400">There are no property owner electricity bill submissions matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div
              key={item._id || item.email}
              className="bg-[#0a110d] border border-emerald-950/90 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                    {item.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{item.name}</h3>
                      {item.verificationStatus === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold flex items-center space-x-1">
                          <CheckCircle2 size={10} />
                          <span>VERIFIED OWNER</span>
                        </span>
                      )}
                      {item.verificationStatus === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-extrabold flex items-center space-x-1">
                          <Clock size={10} />
                          <span>PENDING REVIEW</span>
                        </span>
                      )}
                      {item.verificationStatus === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 text-[10px] font-extrabold flex items-center space-x-1">
                          <XCircle size={10} />
                          <span>REJECTED</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{item.email} • {item.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-[#050806] p-3 rounded-2xl border border-emerald-950">
                    <span className="text-gray-500 font-medium block">Consumer / CA Number</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{item.consumerNumber || 'Not provided'}</span>
                  </div>
                  <div className="bg-[#050806] p-3 rounded-2xl border border-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 font-medium block">Electricity Bill</span>
                      <span className="text-gray-300 font-bold">Document Attached</span>
                    </div>
                    {item.electricityBillUrl && (
                      <a
                        href={item.electricityBillUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#0e2418] hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/80 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-all"
                      >
                        <span>View Document</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 self-end lg:self-center">
                <button
                  onClick={() => handleAction(item._id, item.email, 'reject')}
                  className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleAction(item._id, item.email, 'approve')}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <ShieldCheck size={14} />
                  <span>Approve & Verify Owner</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
