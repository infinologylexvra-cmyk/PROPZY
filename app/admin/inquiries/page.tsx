'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Phone, User, Calendar, CheckCircle2, 
  Clock, Search, ArrowUpRight, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { INITIAL_INQUIRIES } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';
import { getCachedInquiries, setCachedInquiries } from '@/lib/adminCache';
import { useAdminSync } from '@/hooks/useAdminSync';
import { TableSkeletonLoader } from '@/components/Loader';

export default function AdminInquiriesPage() {
  const { showToast } = useApp();
  const cached = getCachedInquiries();
  const [inquiries, setInquiries] = useState<any[]>(cached || INITIAL_INQUIRIES);

  const [loading, setLoading] = useState(!cached);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInquiries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setInquiries(data.data);
        setCachedInquiries(data.data);
      }
    } catch (e) {
      console.warn('Using seeded inquiries fallback:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cached) {
      fetchInquiries();
    }
  }, [cached, fetchInquiries]);

  // Real-time cross-tab sync hook
  useAdminSync({
    dataType: 'inquiries',
    onSync: () => {
      const latest = getCachedInquiries();
      if (latest) {
        setInquiries(latest);
      } else {
        fetchInquiries(true);
      }
    },
    enablePolling: true,
    pollIntervalMs: 12000,
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    setInquiries(prev => {
      const updated = prev.map(inq => (inq.id === id || inq._id === id) ? { ...inq, status: newStatus } : inq);
      setCachedInquiries(updated);
      return updated;
    });
    showToast(`Lead status updated to ${newStatus}`);
  };

  const filteredInquiries = inquiries.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Tenant Leads & Visit Inquiries
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Stream of tenant interest forms, property visit requests & direct lead status tracking.
          </p>
        </div>
        <button
          onClick={() => fetchInquiries(false)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#091a12] border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 rounded-full text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0a110d] p-4 rounded-3xl border border-emerald-950/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-300">
          <Filter size={16} className="text-emerald-400" />
          <span>Filter Leads by Status:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'Contacted', 'Visit Scheduled', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-[#050806] text-gray-400 border border-emerald-950 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Leads' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300">
            Total Leads: <span className="text-emerald-400 font-extrabold">{filteredInquiries.length}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#050806] text-gray-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-emerald-950">
              <tr>
                <th className="p-3.5">Property ID</th>
                <th className="p-3.5">Tenant Details</th>
                <th className="p-3.5">Message / Request</th>
                <th className="p-3.5">Lead Status</th>
                <th className="p-3.5 text-right">Quick Contact Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {loading && inquiries.length === 0 ? (
                <TableSkeletonLoader rows={5} cols={5} message="Loading tenant leads..." />
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No leads found matching status filter.
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((item) => (
                  <tr key={item.id || item._id} className="hover:bg-[#07120a] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-400">{item.propertyPid || 'PZ-101'}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{item.tenantName}</div>
                      <div className="text-[10px] font-mono text-gray-400">{item.tenantPhone}</div>
                    </td>
                    <td className="p-3.5 max-w-xs text-gray-300">
                      <div className="line-clamp-2 italic">"{item.tenantMessage}"</div>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={item.status || 'New'}
                        onChange={(e) => handleStatusChange(item.id || item._id, e.target.value)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border bg-[#050806] cursor-pointer ${
                          item.status === 'Closed'
                            ? 'text-gray-400 border-gray-800'
                            : item.status === 'Visit Scheduled'
                            ? 'text-purple-400 border-purple-800'
                            : item.status === 'Contacted'
                            ? 'text-cyan-400 border-cyan-800'
                            : 'text-emerald-400 border-emerald-800'
                        }`}
                      >
                        <option value="New">NEW LEAD</option>
                        <option value="Contacted">CONTACTED</option>
                        <option value="Visit Scheduled">VISIT SCHEDULED</option>
                        <option value="Closed">CLOSED</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <a
                        href={`tel:${item.tenantPhone}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-extrabold transition-all"
                      >
                        <Phone size={12} />
                        <span>Call Tenant</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
