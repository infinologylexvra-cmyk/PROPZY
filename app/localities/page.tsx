'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LocalitiesPage() {
  const router = useRouter();
  const localities = [
    { city: 'Mohali', name: 'Sector 70', query: 'Sector 70', desc: 'Prime residential hub near Homeland Heights, PCA Stadium & IT City.', count: '6+ verified homes' },
    { city: 'Zirakpur', name: 'VIP Road', query: 'VIP Road', desc: 'High-rise modern apartments with 24/7 security, shopping malls & easy airport connectivity.', count: '5+ verified homes' },
    { city: 'Kharar', name: 'Sunny Enclave', query: 'Sunny Enclave', desc: 'Gated residential colony on Kharar-Chandigarh Highway near VR Punjab Mall.', count: '3+ verified homes' },
    { city: 'Chandigarh', name: 'Sector 35', query: 'Sector 35', desc: 'Heart of Chandigarh with top educational coaching, markets & luxury floors.', count: '2+ verified homes' },
    { city: 'Mohali', name: 'Sector 71', query: 'Sector 71', desc: 'Prime residential hub near Fortis Hospital, Phase 7 market & IT Park.', count: 'Verified homes' },
    { city: 'Panchkula', name: 'Sector 20', query: 'Sector 20', desc: 'Peaceful, green villa neighborhood with great connectivity to Zirakpur & Chandigarh.', count: 'Verified homes' },
    { city: 'Kharar', name: 'Highway & University Area', query: 'Highway', desc: 'Ideal student & bachelor hub near Chandigarh University with verified PGs & flats.', count: 'Verified PGs & Flats' },
    { city: 'Chandigarh', name: 'Sector 22 & PGI Corridor', query: 'Sector 22', desc: 'Central shopping, hospitality and medical hub near PGI and Panjab University.', count: 'Verified homes' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0a140f] border border-emerald-900/80 hover:border-emerald-500 hover:bg-[#0f2219] text-gray-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 group cursor-pointer"
        >
          <ArrowLeft size={15} className="text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Explore Popular Localities</h1>
        <p className="text-xs text-gray-500">Discover top neighborhood profiles across Chandigarh Tricity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {localities.map((loc) => (
          <Link
            key={loc.name}
            href={`/properties?city=${loc.city}&locality=${encodeURIComponent(loc.query)}`}
            className="p-6 bg-[#080d0a] hover:bg-[#0c1610] rounded-3xl border border-emerald-950/90 hover:border-emerald-500/60 shadow-lg hover:shadow-2xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold mb-2">
                <MapPin size={16} className="text-emerald-400 shrink-0" />
                <span>{loc.city} • {loc.name}</span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">{loc.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{loc.desc}</p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold pt-3 border-t border-emerald-950/80">
              <span className="text-gray-400">{loc.count}</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1 group-hover:underline">
                <span>View Listings</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
