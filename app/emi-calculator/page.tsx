'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building, ArrowRight } from 'lucide-react';

export default function EmiCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState<number>(5000000); // 50 Lakhs
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState<number>(20); // 20 years

  // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Building size={24} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Home Loan EMI Calculator</h1>
        <p className="text-xs text-gray-500">Calculate your monthly home loan repayments before buying a property</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
              <span>Home Loan Amount</span>
              <span className="text-orange-600 font-extrabold text-sm">₹{(loanAmount / 100000).toFixed(2)} Lakhs</span>
            </div>
            <input
              type="range"
              min={500000}
              max={20000000}
              step={100000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
              <span>Interest Rate (% p.a.)</span>
              <span className="text-amber-600 font-extrabold text-sm">{interestRate}%</span>
            </div>
            <input
              type="range"
              min={6.5}
              max={14.0}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-800 mb-2">
              <span>Tenure (Years)</span>
              <span className="text-gray-900 font-extrabold text-sm">{tenureYears} Years</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs text-gray-400 font-medium block uppercase tracking-wider mb-1">
              Monthly EMI Payable
            </span>
            <div className="text-4xl font-extrabold text-amber-400">
              ₹{emi.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-300">/mo</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-700 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Principal Amount:</span>
              <span className="font-bold">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Interest Payable:</span>
              <span className="font-bold text-orange-300">₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Amount Payable:</span>
              <span className="font-bold text-emerald-400">₹{totalPayment.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Link
            href="/properties?category=buy"
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-xl font-bold text-xs shadow-lg transition-all text-center flex items-center justify-center space-x-2"
          >
            <span>Explore Properties for Sale</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
