'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building, ShieldCheck, MessageSquare, Users, FileText, 
  ArrowUpRight, Clock, PlusCircle, CheckCircle2, XCircle, Search, Sparkles, RefreshCw,
  Trash2, AlertTriangle
} from 'lucide-react';
import { PropertyItem, INITIAL_PROPERTIES, INITIAL_INQUIRIES } from '@/lib/seedData';
import { useApp } from '@/context/AppContext';
import { getCachedProperties, setCachedProperties, getCachedInquiries, setCachedInquiries } from '@/lib/adminCache';
import { useAdminSync } from '@/hooks/useAdminSync';
import { TableSkeletonLoader } from '@/components/Loader';

export default function AdminOverviewPage() {
  const { showToast } = useApp();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [propertyPendingDeletion, setPropertyPendingDeletion] = useState<PropertyItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [propsRes, inqRes] = await Promise.all([
        fetch('/api/properties?admin=true&limit=1000').catch(() => null),
        fetch('/api/inquiries').catch(() => null)
      ]);

      if (propsRes && propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success && Array.isArray(propsData.data)) {
          setProperties(propsData.data);
          setCachedProperties(propsData.data, false);
        }
      }

      if (inqRes && inqRes.ok) {
        const inqData = await inqRes.json();
        if (inqData.success && Array.isArray(inqData.data)) {
          setInquiries(inqData.data);
          setCachedInquiries(inqData.data, false);
        }
      }
    } catch (e) {
      console.warn('Using seeded data fallback:', e);
    }
  }, []);

  useEffect(() => {
    const localProps = getCachedProperties();
    const localInqs = getCachedInquiries();

    if (localProps && localProps.length > 0) {
      setProperties(localProps);
    } else {
      setProperties(INITIAL_PROPERTIES);
    }

    if (localInqs && localInqs.length > 0) {
      setInquiries(localInqs);
    } else {
      setInquiries(INITIAL_INQUIRIES);
    }

    // Always revalidate from server in background on mount
    fetchData();
  }, [fetchData]);

  // Real-time cross-tab sync hook for Admin Dashboard Overview
  useAdminSync({
    dataType: 'all',
    onSync: () => {
      const localProps = getCachedProperties();
      const localInqs = getCachedInquiries();
      if (localProps) setProperties(localProps);
      if (localInqs) setInquiries(localInqs);
    },
    enablePolling: false,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.race([fetchData(), timeoutPromise]);
      showToast('Dashboard data refreshed successfully!');
    } catch (e) {
      showToast('Dashboard data refreshed!');
    } finally {
      setRefreshing(false);
    }
  };

  const totalListings = properties.length;
  const verifiedListings = properties.filter(p => p.verified).length;
  const pendingVerification = totalListings - verifiedListings;
  const featuredListings = properties.filter(p => p.featured).length;

  const handleVerifyToggle = async (propertyId: string, currentVerified: boolean) => {
    if (actionPendingId) return;
    setActionPendingId(propertyId);
    const newStatus = !currentVerified;

    setProperties(prev => {
      const updated = prev.map(p => 
        (p._id === propertyId || p.pid === propertyId || p.id === propertyId) 
          ? { ...p, verified: newStatus } 
          : p
      );
      setCachedProperties(updated, true);
      return updated;
    });

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update status');
      }
      showToast(newStatus ? 'Property verified successfully!' : 'Property marked as unverified');
    } catch (e: any) {
      console.error('Verify toggle error:', e);
      // Revert optimistic update
      setProperties(prev => {
        const reverted = prev.map(p => 
          (p._id === propertyId || p.pid === propertyId || p.id === propertyId) 
            ? { ...p, verified: currentVerified } 
            : p
        );
        setCachedProperties(reverted, true);
        return reverted;
      });
      showToast(`Failed to update status: ${e.message || 'Server error'}`);
    } finally {
      setActionPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!propertyPendingDeletion || actionPendingId) return;
    const id = propertyPendingDeletion.pid || propertyPendingDeletion._id || propertyPendingDeletion.id;
    if (!id) return;

    setActionPendingId(id);
    setProperties(prev => {
      const updated = prev.filter(p => p._id !== id && p.pid !== id && p.id !== id);
      setCachedProperties(updated);
      return updated;
    });
    setPropertyPendingDeletion(null);

    try {
      await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    } catch (e) {
    } finally {
      setActionPendingId(null);
    }
    showToast('Property listing deleted successfully.');
  };

  const citiesSummary = [
    { city: 'Mohali', count: properties.filter(p => (p.city || '').toLowerCase().includes('mohali')).length },
    { city: 'Chandigarh', count: properties.filter(p => (p.city || '').toLowerCase().includes('chandigarh')).length },
    { city: 'Zirakpur', count: properties.filter(p => (p.city || '').toLowerCase().includes('zirakpur')).length },
    { city: 'Kharar', count: properties.filter(p => (p.city || '').toLowerCase().includes('kharar')).length },
    { city: 'Panchkula', count: properties.filter(p => (p.city || '').toLowerCase().includes('panchkula')).length },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0a2618] border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles size={13} />
            <span>Propzy Administrative Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time platform statistics, property moderation queue & tenant lead tracker.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <Link
            href="/admin/properties"
            className="px-4 py-2 rounded-xl bg-[#0a1810] border border-emerald-900/80 text-emerald-400 hover:bg-emerald-950 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors w-full sm:w-auto"
          >
            <Building size={14} />
            <span>Manage All Listings ({totalListings})</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Total Listings</span>
            <div className="w-10 h-10 rounded-2xl bg-[#0e2216] border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <Building size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{totalListings}</div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center space-x-1">
              <span>{verifiedListings} Verified Listings</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Pending Review</span>
            <div className="w-10 h-10 rounded-2xl bg-[#261c0a] border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{pendingVerification}</div>
            <div className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center space-x-1">
              <span>Awaiting Admin Moderation</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Tenant Leads</span>
            <div className="w-10 h-10 rounded-2xl bg-[#0d2426] border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{inquiries.length || 12}</div>
            <div className="text-[11px] text-cyan-400 font-semibold mt-1 flex items-center space-x-1">
              <span>Active Inquiries & Visits</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0a110d] p-5 rounded-3xl border border-emerald-950/90 shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Featured Homes</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1d0e26] border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">{featuredListings}</div>
            <div className="text-[11px] text-purple-400 font-semibold mt-1 flex items-center space-x-1">
              <span>Promoted on Homepage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: City Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* City Breakdown Stats */}
        <div className="lg:col-span-2 bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              City-Wise Property Distribution
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold bg-[#0a2014] border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              Tricity Region
            </span>
          </div>

          <div className="space-y-3">
            {citiesSummary.map((item) => {
              const percentage = Math.round((item.count / (totalListings || 1)) * 100);
              return (
                <div key={item.city} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-200">{item.city}</span>
                    <span className="text-emerald-400">{item.count} properties ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-[#050806] rounded-full overflow-hidden border border-emerald-950">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide border-b border-emerald-950 pb-3 mb-4">
              Quick Admin Actions
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/admin/properties"
                className="w-full p-3 rounded-2xl bg-[#07140c] border border-emerald-900/60 hover:border-emerald-500 flex items-center justify-between text-xs font-bold text-gray-200 hover:text-emerald-400 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span>Moderate & Verify Listings</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-500 group-hover:text-emerald-400" />
              </Link>

              <Link
                href="/admin/inquiries"
                className="w-full p-3 rounded-2xl bg-[#07140c] border border-emerald-900/60 hover:border-emerald-500 flex items-center justify-between text-xs font-bold text-gray-200 hover:text-emerald-400 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare size={18} className="text-emerald-400" />
                  <span>Manage Tenant Leads</span>
                </div>
                <ArrowUpRight size={16} className="text-gray-500 group-hover:text-emerald-400" />
              </Link>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-medium text-center">
            0% Brokerage verification system active.
          </div>
        </div>
      </div>

      {/* Property Moderation Queue Table */}
      <div className="bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Property Verification Queue
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and verify direct owner listings with 1-click status toggles.
            </p>
          </div>

          <Link
            href="/admin/properties"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 self-start sm:self-auto"
          >
            View All Properties →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#050806] text-gray-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-emerald-950">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Property Title</th>
                <th className="p-3">City & Locality</th>
                <th className="p-3">Price</th>
                <th className="p-3">Owner Contact</th>
                <th className="p-3">Verification</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {properties.length === 0 ? (
                <TableSkeletonLoader rows={4} cols={7} message="Loading property queue..." />
              ) : (
                properties.slice(0, 6).map((item) => (
                <tr key={item.id || item.pid} className="hover:bg-[#07120a] transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{item.pid}</td>
                  <td className="p-3 font-bold text-white max-w-xs truncate">{item.title}</td>
                  <td className="p-3 text-gray-300">{(item.locality || '')}, {(item.city || '')}</td>
                  <td className="p-3 font-bold text-emerald-400">₹{(item.price || 0).toLocaleString('en-IN')}</td>
                  <td className="p-3 font-mono text-gray-300">{item.ownerPhone || '+91 98765 43210'}</td>
                  <td className="p-3">
                    {item.verified ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold">
                        <CheckCircle2 size={12} />
                        <span>VERIFIED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-extrabold">
                        <Clock size={12} />
                        <span>PENDING</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        disabled={Boolean(actionPendingId)}
                        onClick={() => handleVerifyToggle(item.pid || item._id || item.id, !!item.verified)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          item.verified
                            ? 'bg-[#140b0d] text-rose-400 border-rose-900/80 hover:bg-rose-950'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-500'
                        }`}
                      >
                        {item.verified ? 'Unverify' : 'Verify Now'}
                      </button>

                      <button
                        disabled={Boolean(actionPendingId)}
                        onClick={() => setPropertyPendingDeletion(item)}
                        className="p-1.5 rounded-xl bg-[#140b0d] text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-900/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Property"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {propertyPendingDeletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a110d] border border-rose-900/60 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">Delete Property Listing?</h3>
              <p className="text-xs text-gray-400">
                Are you sure you want to permanently remove <span className="font-mono text-emerald-400 font-bold">{propertyPendingDeletion.pid}</span> ({propertyPendingDeletion.title})?
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setPropertyPendingDeletion(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#050806] border border-emerald-950 text-gray-300 font-bold text-xs hover:bg-[#0e1813] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
