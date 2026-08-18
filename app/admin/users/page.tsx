'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, ShieldCheck, UserCheck, Search, Filter, RefreshCw, Phone, Mail, Building } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCachedUsers, setCachedUsers } from '@/lib/adminCache';
import { useAdminSync } from '@/hooks/useAdminSync';
import { TableSkeletonLoader } from '@/components/Loader';

export default function AdminUsersPage() {
  const { showToast } = useApp();
  const cached = getCachedUsers();
  const [users, setUsers] = useState<any[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'tenant' | 'admin'>('all');

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
        setCachedUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cached || cached.length === 0) {
      fetchUsers();
    }
  }, [cached, fetchUsers]);

  // Real-time cross-tab sync
  useAdminSync({
    dataType: 'users',
    onSync: () => {
      const latest = getCachedUsers();
      if (latest && latest.length > 0) {
        setUsers(latest);
      } else {
        fetchUsers(true);
      }
    },
    enablePolling: true,
    pollIntervalMs: 12000,
  });

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').includes(q);
      const matchRole = (u.role || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            User & Landlord Directory
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Registered owners, landlords, tenants, and admin account permissions.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(false)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#091a12] border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 rounded-full text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0a110d] p-4 rounded-3xl border border-emerald-950/90 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Role Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {(['all', 'owner', 'tenant', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-[#050806] text-gray-400 border border-emerald-950 hover:text-white'
              }`}
            >
              {r === 'all' ? 'All Roles' : `${r}s`}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#050806] border border-emerald-950 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300">
            Total Users: <span className="text-emerald-400 font-extrabold">{filteredUsers.length}</span> of {users.length}
          </span>
          {loading && (
            <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1.5 animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span>Fetching live user records...</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#050806] text-gray-400 font-extrabold uppercase tracking-wider text-[10px] border-b border-emerald-950">
              <tr>
                <th className="p-3.5">User Profile</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Account Role</th>
                <th className="p-3.5">Posted Properties</th>
                <th className="p-3.5 text-right">Status Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60">
              {loading ? (
                <TableSkeletonLoader rows={5} cols={5} message="Loading directory users..." />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-emerald-900/60" />
                    <p className="font-bold text-white text-sm">No registered users found</p>
                    <p className="text-[11px] text-gray-500 mt-1">Try resetting search filters or refreshing directory.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id || u._id || u.email} className="hover:bg-[#07120a] transition-colors">
                    <td className="p-3.5 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs shadow">
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{u.name || 'Anonymous User'}</span>
                          {u.ownerVerified && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-300">{u.phone || 'Not provided'}</td>
                    <td className="p-3.5 font-semibold capitalize">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : u.role === 'owner'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      }`}>
                        {u.role || 'tenant'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {u.propertiesCount !== undefined ? u.propertiesCount : (u.postedProperties?.length || 0)} Listings
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => showToast(`User ${u.name || u.email} is active and verified`)}
                        className="px-3 py-1 rounded-xl bg-[#0a1810] border border-emerald-900 hover:border-emerald-500 text-emerald-400 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Active
                      </button>
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
