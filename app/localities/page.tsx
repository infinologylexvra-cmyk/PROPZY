'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

export default function LocalitiesPage() {
  const localities = [
    { city: 'Mohali', name: 'Sector 71', desc: 'Prime residential hub near Fortis Hospital & IT Park.', count: '450+ verified homes' },
    { city: 'Mohali', name: 'Phase 3B2', desc: 'Famous for bustling market, cafes, and luxury builder floors.', count: '380+ verified homes' },
    { city: 'Chandigarh', name: 'Sector 35', desc: 'Heart of Chandigarh with top educational coaching & food street.', count: '520+ verified homes' },
    { city: 'Zirakpur', name: 'VIP Road', desc: 'High-rise modern apartments with 24/7 security and shopping malls.', count: '610+ verified homes' },
    { city: 'Kharar', name: 'CU Highway', desc: 'Ideal student & bachelor hub near Chandigarh University.', count: '750+ PG & flats' },
    { city: 'Panchkula', name: 'Sector 20', desc: 'Peaceful, green villa neighborhood with great connectivity.', count: '290+ verified homes' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Explore Popular Localities</h1>
        <p className="text-xs text-gray-500">Discover top neighborhood profiles across Chandigarh Tricity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {localities.map((loc) => (
          <Link
            key={loc.name}
            href={`/properties?city=${loc.city}&locality=${loc.name}`}
            className="p-6 bg-emerald-800/20 rounded-3xl border border-emerald-400/40 shadow-xs hover:shadow-xl transition-all group"
          >
            <div className="flex items-center space-x-2 text-xs text-emerald-500 font-bold mb-2">
              <MapPin size={16} />
              <span>{loc.city} • {loc.name}</span>
            </div>
            <h3 className="text-base font-bold text-white hover:text-emerald-500-group  mb-2">{loc.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{loc.desc}</p>
            <div className="flex items-center justify-between text-xs font-semibold pt-3 border-t border-gray-700">
              <span className="text-gray-500">{loc.count}</span>
              <span className="text-emerald-500 flex items-center space-x-1 group-hover:underline">
                <span>View Listings</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
