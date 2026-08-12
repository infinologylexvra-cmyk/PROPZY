'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function RentCalculatorPage() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(60000);
  const [otherExpenses, setOtherExpenses] = useState<number>(15000);

  const maxRecommendedRent = Math.round(monthlyIncome * 0.3); // 30% rule
  const netDisposableIncome = monthlyIncome - otherExpenses;
  const conservativeRent = Math.round(monthlyIncome * 0.25);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Calculator size={24} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Rent Affordability Calculator</h1>
        <p className="text-xs text-gray-500">Calculate how much rent fits comfortably within your monthly budget</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sliders Input */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
              <span>Gross Monthly Income</span>
              <span className="text-orange-600 font-extrabold text-sm">₹{monthlyIncome.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={20000}
              max={300000}
              step={5000}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
              <span>Other Monthly Expenses / EMIs</span>
              <span className="text-gray-900 font-extrabold text-sm">₹{otherExpenses.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100000}
              step={2000}
              value={otherExpenses}
              onChange={(e) => setOtherExpenses(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-xs text-orange-900 space-y-1">
            <strong>The 30% Financial Rule:</strong>
            <p className="text-[11px] text-orange-800">
              Financial experts recommend allocating no more than 30% of your gross income towards rent for long-term savings stability.
            </p>
          </div>
        </div>

        {/* Calculation Result */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs text-gray-400 font-medium block uppercase tracking-wider mb-1">
              Recommended Max Monthly Rent
            </span>
            <div className="text-4xl font-extrabold text-orange-400">
              ₹{maxRecommendedRent.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-300">/mo</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-700 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Conservative Rent Budget (25%):</span>
              <span className="font-bold">₹{conservativeRent.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Net Savings:</span>
              <span className="font-bold text-emerald-400">₹{(netDisposableIncome - maxRecommendedRent).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Link
            href={`/properties?maxPrice=${maxRecommendedRent}`}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all text-center flex items-center justify-center space-x-2"
          >
            <span>Browse Homes under ₹{maxRecommendedRent.toLocaleString('en-IN')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
