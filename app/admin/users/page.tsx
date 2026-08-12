'use client';

import React, { useState } from 'react';
import { Users, ShieldCheck, UserCheck, Home, Phone, Mail } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCachedUsers, setCachedUsers } from '@/lib/adminCache';


export default function AdminUsersPage() {
  const { showToast } = useApp();
  const cached = getCachedUsers();
  const [users, setUsers] = useState<any[]>(cached || []);
  const [loading, setLoading] = React.useState(!cached);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success && data.data) {
          setUsers(data.data);
          setCachedUsers(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!cached) {
      fetchUsers();
    }
  }, []);


  return (
    <div className="space-y-6">
      <div className="border-b border-emerald-950/80 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          User & Landlord Directory
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Registered owners, landlords, tenants, and admin account permissions.
        </p>
      </div>

      <div className="bg-[#0a110d] rounded-3xl border border-emerald-950/90 shadow-xl overflow-hidden">
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#07120a] transition-colors">
                  <td className="p-3.5 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[10px] text-gray-400">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-gray-300">{u.phone}</td>
                  <td className="p-3.5 font-semibold text-emerald-400">{u.role}</td>
                  <td className="p-3.5 font-bold text-white">{u.propertiesCount} Listings</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => showToast(`User ${u.name} status active`)}
                      className="px-3 py-1 rounded-xl bg-[#0a1810] border border-emerald-900 text-emerald-400 text-[10px] font-bold"
                    >
                      Active
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
