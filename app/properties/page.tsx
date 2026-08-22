'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, SlidersHorizontal, ShieldCheck, Search, RefreshCw, X, ChevronLeft, ArrowLeft, Home as HomeIcon } from 'lucide-react';
import { PropertyItem, INITIAL_PROPERTIES } from '@/lib/seedData';
import { PropertyCard } from '@/components/PropertyCard';
import { InquiryModal } from '@/components/InquiryModal';
import { SkeletonGrid } from '@/components/Loader';
import { CallToActionBanner } from '@/components/CallToActionBanner';
import { useApp } from '@/context/AppContext';
import { getClientPropertiesCache, setClientPropertiesCache } from '@/lib/clientPropertiesCache';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

function PropertySearchContent() {
  const { user, openAuthModal, showToast } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const urlCategory = searchParams.get('category') || 'all';
  const urlCity = searchParams.get('city') || 'all';
  const urlLocality = searchParams.get('locality') || '';
  const urlPid = searchParams.get('pid') || '';
  const urlType = searchParams.get('type') || 'all';
  const urlBedrooms = searchParams.get('bedrooms') || 'all';
  const urlVerified = searchParams.get('verified') === 'true';

  // Always reset scroll to top immediately when entering or filtering properties
  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [urlCategory, urlCity, urlType]);

  const isBuyOrSell = (c: string) => c === 'buy' || c === 'sell';
  const defaultRentMax = 1500000; // 15 Lakh
  const defaultBuyMax = 50000000; // 5 Cr

  const rawUrlMax = searchParams.get('maxPrice');
  const initialMaxPrice = rawUrlMax
    ? Number(rawUrlMax)
    : (isBuyOrSell(urlCategory) ? defaultBuyMax : defaultRentMax);

  const [category, setCategory] = useState(urlCategory);
  const [city, setCity] = useState(urlCity);
  const [locality, setLocality] = useState(urlLocality);
  const [pidSearch, setPidSearch] = useState(urlPid);
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);
  const [type, setType] = useState(urlType);
  const [bedrooms, setBedrooms] = useState(urlBedrooms);
  const [verifiedOnly, setVerifiedOnly] = useState(urlVerified);

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(21);
  const [selectedPropertyForInquiry, setSelectedPropertyForInquiry] = useState<PropertyItem | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (isBuyOrSell(newCat)) {
      if (maxPrice < 1000000) setMaxPrice(defaultBuyMax);
    } else {
      if (maxPrice > defaultRentMax) setMaxPrice(defaultRentMax);
    }
  };

  // Sync state when URL params change
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setCategory(cat);
    setCity(searchParams.get('city') || 'all');
    setLocality(searchParams.get('locality') || '');
    setPidSearch(searchParams.get('pid') || '');
    setType(searchParams.get('type') || 'all');
    setBedrooms(searchParams.get('bedrooms') || 'all');
    setVerifiedOnly(searchParams.get('verified') === 'true');

    const rawMax = searchParams.get('maxPrice');
    if (rawMax) {
      setMaxPrice(Number(rawMax));
    } else {
      setMaxPrice(isBuyOrSell(cat) ? defaultBuyMax : defaultRentMax);
    }
  }, [searchParams]);

  const fetchFilteredProperties = async () => {
    // Build query params
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (city !== 'all') params.set('city', city);
    if (locality) params.set('locality', locality);
    if (pidSearch) params.set('pid', pidSearch);
    if (type !== 'all') params.set('type', type);
    if (bedrooms !== 'all') params.set('bedrooms', bedrooms);
    if (verifiedOnly) params.set('verified', 'true');
    if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice.toString());

    const clientCacheKey = params.toString();

    // 1. Client-Side Instant Cache Check
    const cached = getClientPropertiesCache(clientCacheKey);
    let shouldFetch = true;

    if (cached && Array.isArray(cached.data)) {
      const filteredCached = verifiedOnly
        ? cached.data.filter((p: any) => p.verified === true)
        : cached.data;
      setProperties(filteredCached);
      setLoading(false);

      // If client cache is fresh (< 30 seconds), avoid network fetch
      if (Date.now() - cached.timestamp < 30000) {
        shouldFetch = false;
      }
    } else {
      setLoading(true);
    }

    if (!shouldFetch) return;

    // 2. Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++latestRequestIdRef.current;

    try {
      const fetchUrl = `/api/properties?${clientCacheKey}${clientCacheKey ? '&' : ''}limit=100`;
      const res = await fetch(fetchUrl, {
        signal: controller.signal
      });

      const data = await res.json();

      // Guard: Ignore if a newer request was dispatched in the meantime
      if (currentRequestId !== latestRequestIdRef.current) return;

      if (res.ok && data.success && Array.isArray(data.data)) {
        const filteredData = verifiedOnly
          ? data.data.filter((p: any) => p.verified === true)
          : data.data;
        setProperties(filteredData);
        setClientPropertiesCache(clientCacheKey, filteredData, data.pagination);
      } else {
        setProperties([]);
      }
    } catch (e: any) {
      // Ignore intentional abort cancellations silently
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }

      if (currentRequestId !== latestRequestIdRef.current) return;

      console.warn('Properties fetch API error:', e);
      setProperties([]);
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounce maxPrice slider changes (400ms) to avoid request flooding
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMaxPrice(maxPrice), 400);
    return () => clearTimeout(timer);
  }, [maxPrice]);

  // Clean up in-flight abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetchFilteredProperties();
  }, [category, city, locality, pidSearch, debouncedMaxPrice, type, bedrooms, verifiedOnly]);

  // Reset lazy load batch size whenever filter options change
  useEffect(() => {
    setDisplayedCount(21);
  }, [category, city, locality, pidSearch, debouncedMaxPrice, type, bedrooms, verifiedOnly]);

  const handleResetFilters = () => {
    setCategory('all');
    setCity('all');
    setLocality('');
    setPidSearch('');
    setMaxPrice(defaultRentMax);
    setType('all');
    setBedrooms('all');
    setVerifiedOnly(false);
    setDisplayedCount(21);
    router.push('/properties');
  };

  const getDynamicPageHeading = () => {
    const typeNames: Record<string, string> = {
      flat: 'Apartments & Flats',
      house: 'Houses & Villas',
      pg: 'PG & Hostels',
      commercial: 'Commercial Properties'
    };

    const typeLabel = type !== 'all' ? typeNames[type] || type : 'Properties';
    const cityLabel = city !== 'all' ? `in ${city}` : 'in Chandigarh Tricity';
    const purposeLabel = category === 'buy' ? 'for Sale' : category === 'pg' || type === 'pg' ? '' : 'for Rent';

    return `${typeLabel} ${purposeLabel} ${cityLabel}`.replace(/\s+/g, ' ').trim();
  };

  const getBreadcrumbTypeLabel = () => {
    if (type === 'flat') return 'Apartments';
    if (type === 'house') return 'Houses';
    if (type === 'pg') return 'PG & Hostels';
    if (type === 'commercial') return 'Commercial';
    if (category === 'pg') return 'PG';
    if (category === 'buy') return 'Buy';
    return 'Properties';
  };

  const visibleProperties = properties.slice(0, displayedCount);

  return (
    <div className="bg-[#050806] text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-[85vh]">
        {/* Top Back Navigation Bar & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => {
              router.push('/');
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0a140f] border border-emerald-900/80 hover:border-emerald-500 hover:bg-[#0f2219] text-gray-200 hover:text-white text-xs font-bold transition-all shadow-md active:scale-95 group cursor-pointer"
          >
            <ArrowLeft size={15} className="text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </button>

          {/* Breadcrumb Links */}
          <nav className="flex items-center space-x-1.5 text-xs text-gray-400 overflow-x-auto whitespace-nowrap py-1">
            <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center space-x-1">
              <HomeIcon size={12} className="text-emerald-400" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">{getBreadcrumbTypeLabel()}</span>
            {city !== 'all' && (
              <>
                <span>/</span>
                <span className="text-gray-300 font-semibold">{city}</span>
              </>
            )}
            {locality && (
              <>
                <span>/</span>
                <span className="text-gray-300">{locality}</span>
              </>
            )}
          </nav>
        </div>

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-emerald-950/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {getDynamicPageHeading()}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Showing verified 0% brokerage listings {city !== 'all' ? `in ${city}` : 'across Chandigarh Tricity'}
            </p>
          </div>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleResetFilters}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 self-start md:self-auto px-3.5 py-2 rounded-full bg-[#0a140f] border border-emerald-900/60 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Header Actions & Mobile Filter Button */}
        <div className="flex items-center justify-between md:hidden bg-[#0a110d] p-4 rounded-2xl border border-emerald-950">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-extrabold shadow-md cursor-pointer"
          >
            <SlidersHorizontal size={16} />
            <span>Filter Properties ({properties.length})</span>
          </button>
          <span className="text-xs text-gray-400 font-semibold">{properties.length} results</span>
        </div>

        {/* Mobile Slide-over Filters Drawer (Left-Aligned) */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-100 bg-black/85 backdrop-blur-md md:hidden flex justify-start">
            <div className="w-full max-w-[340px] sm:max-w-sm bg-[#08100c] h-full flex flex-col border-r border-emerald-900/80 shadow-2xl animate-in slide-in-from-left duration-200">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-950/80 bg-[#0a140f] shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Filters</h3>
                    <p className="text-[10px] text-gray-400">{properties.length} Listings Available</p>
                  </div>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#050806] border border-emerald-950 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Purpose / Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleCategoryChange('all')}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold capitalize border transition-all text-center ${category === 'all'
                        ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                        : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                        }`}
                    >
                      All Properties
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleCategoryChange('rent')}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold capitalize border transition-all text-center ${category === 'rent'
                        ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                        : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                        }`}
                    >
                      For Rent
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleCategoryChange('buy')}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold capitalize border transition-all text-center ${category === 'buy' || category === 'sell'
                        ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                        : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                        }`}
                    >
                      Buy / Sale
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleCategoryChange('pg')}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold capitalize border transition-all text-center ${category === 'pg'
                        ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                        : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                        }`}
                    >
                      PG / Hostel
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => handleCategoryChange('commercial')}
                      className={`col-span-2 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold capitalize border transition-all text-center ${category === 'commercial'
                        ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                        : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                        }`}
                    >
                      Commercial Spaces
                    </button>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">City</label>
                  <select
                    suppressHydrationWarning
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-emerald-900/80 rounded-xl bg-[#050806] focus:border-emerald-500 focus:outline-none text-white cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#0a110d] text-white">All Cities</option>
                    <option value="Mohali" className="bg-[#0a110d] text-white">Mohali</option>
                    <option value="Chandigarh" className="bg-[#0a110d] text-white">Chandigarh</option>
                    <option value="Kharar" className="bg-[#0a110d] text-white">Kharar</option>
                    <option value="Zirakpur" className="bg-[#0a110d] text-white">Zirakpur</option>
                    <option value="Panchkula" className="bg-[#0a110d] text-white">Panchkula</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Property Type</label>
                  <select
                    suppressHydrationWarning
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-emerald-900/80 rounded-xl bg-[#050806] focus:border-emerald-500 focus:outline-none text-white cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#0a110d] text-white">All Types</option>
                    <option value="flat" className="bg-[#0a110d] text-white">Flat / Apartment</option>
                    <option value="house" className="bg-[#0a110d] text-white">House / Villa</option>
                    <option value="pg" className="bg-[#0a110d] text-white">PG / Hostel</option>
                    <option value="commercial" className="bg-[#0a110d] text-white">Commercial Space</option>
                  </select>
                </div>

                {/* Max Budget Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-300">Max Budget</span>
                    <span className="text-emerald-400 font-extrabold font-mono">
                      {`₹${maxPrice.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    suppressHydrationWarning
                    min={isBuyOrSell(category) ? 1000000 : 5000}
                    max={isBuyOrSell(category) ? defaultBuyMax : defaultRentMax}
                    step={isBuyOrSell(category) ? 500000 : 5000}
                    value={maxPrice > (isBuyOrSell(category) ? defaultBuyMax : defaultRentMax) ? (isBuyOrSell(category) ? defaultBuyMax : defaultRentMax) : maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{isBuyOrSell(category) ? '₹10 Lakhs' : '₹5,000'}</span>
                    <span>{isBuyOrSell(category) ? '₹5 Cr+' : '₹15 Lakhs+'}</span>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Bedrooms (BHK)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['all', '1', '2', '3'].map((bhk) => (
                      <button
                        key={bhk}
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setBedrooms(bhk)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${bedrooms === bhk
                          ? 'bg-emerald-500 text-black border-emerald-500 shadow-md font-extrabold'
                          : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                          }`}
                      >
                        {bhk === 'all' ? 'All' : `${bhk} BHK`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified Toggle */}
                <div className="pt-3 border-t border-emerald-950">
                  <label className="flex items-center justify-between cursor-pointer select-none bg-[#050806] border border-emerald-950 p-3 rounded-xl hover:border-emerald-900 transition-colors">
                    <span className="text-xs font-semibold text-gray-300 flex items-center space-x-2">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Verified Only</span>
                    </span>
                    <input
                      type="checkbox"
                      suppressHydrationWarning
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded accent-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="p-4 border-t border-emerald-950 bg-[#0a140f] shrink-0 flex items-center space-x-2.5">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setCategory('all');
                    setCity('all');
                    setType('all');
                    setBedrooms('all');
                    setVerifiedOnly(false);
                    setMaxPrice(defaultRentMax);
                    setLocality('');
                    setPidSearch('');
                  }}
                  className="px-4 py-3 rounded-xl bg-[#050806] hover:bg-[#07130b] text-gray-400 hover:text-white border border-emerald-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-center"
                >
                  Apply Filters ({properties.length})
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Desktop/Tablet Sidebar Filters */}
          <aside className="hidden md:block md:col-span-1 bg-[#0a110d] p-6 rounded-3xl border border-emerald-950/90 shadow-xl sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <span className="text-sm font-bold text-white flex items-center space-x-2">
                <SlidersHorizontal size={16} className="text-emerald-400" />
                <span>Filters</span>
              </span>
              <span className="text-[10px] bg-[#0d261a] text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-bold">
                {properties.length} Listings
              </span>
            </div>

            {/* Category Tabs */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Purpose / Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleCategoryChange('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${category === 'all'
                    ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                    : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                    }`}
                >
                  All Properties
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleCategoryChange('rent')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${category === 'rent'
                    ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                    : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                    }`}
                >
                  For Rent
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleCategoryChange('buy')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${category === 'buy' || category === 'sell'
                    ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                    : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                    }`}
                >
                  Buy / Sale
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleCategoryChange('pg')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${category === 'pg'
                    ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                    : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                    }`}
                >
                  PG / Hostel
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleCategoryChange('commercial')}
                  className={`col-span-2 px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${category === 'commercial'
                    ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-md'
                    : 'bg-[#050806] text-gray-300 border-emerald-950 hover:border-emerald-800'
                    }`}
                >
                  Commercial Spaces
                </button>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">City</label>
              <select
                suppressHydrationWarning
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-emerald-900/80 rounded-xl bg-[#050806] focus:border-emerald-500 focus:outline-none font-medium text-white cursor-pointer"
              >
                <option value="all" className="bg-[#0a110d] text-white">All Cities</option>
                <option value="Mohali" className="bg-[#0a110d] text-white">Mohali</option>
                <option value="Chandigarh" className="bg-[#0a110d] text-white">Chandigarh</option>
                <option value="Kharar" className="bg-[#0a110d] text-white">Kharar</option>
                <option value="Zirakpur" className="bg-[#0a110d] text-white">Zirakpur</option>
                <option value="Panchkula" className="bg-[#0a110d] text-white">Panchkula</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Property Type</label>
              <select
                suppressHydrationWarning
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-emerald-900/80 rounded-xl bg-[#050806] focus:border-emerald-500 focus:outline-none font-medium text-white cursor-pointer"
              >
                <option value="all" className="bg-[#0a110d] text-white">All Types</option>
                <option value="flat" className="bg-[#0a110d] text-white">Flat / Apartment</option>
                <option value="house" className="bg-[#0a110d] text-white">House / Villa</option>
                <option value="pg" className="bg-[#0a110d] text-white">PG / Hostel</option>
                <option value="commercial" className="bg-[#0a110d] text-white">Commercial Space</option>
              </select>
            </div>

            {/* Max Budget Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-gray-300">Max Budget</span>
                <span className="text-emerald-400 font-extrabold">
                  {`₹${maxPrice.toLocaleString('en-IN')}`}
                </span>
              </div>
              <input
                type="range"
                suppressHydrationWarning
                min={isBuyOrSell(category) ? 1000000 : 5000}
                max={isBuyOrSell(category) ? defaultBuyMax : defaultRentMax}
                step={isBuyOrSell(category) ? 500000 : 5000}
                value={maxPrice > (isBuyOrSell(category) ? defaultBuyMax : defaultRentMax) ? (isBuyOrSell(category) ? defaultBuyMax : defaultRentMax) : maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{isBuyOrSell(category) ? '₹10 Lakhs' : '₹5,000'}</span>
                <span>{isBuyOrSell(category) ? '₹5 Cr+' : '₹15 Lakhs+'}</span>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Bedrooms (BHK)</label>
              <div className="flex space-x-2">
                {['all', '1', '2', '3'].map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setBedrooms(bhk)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${bedrooms === bhk
                      ? 'bg-emerald-500 text-black border-emerald-500'
                      : 'bg-[#050806] text-gray-400 border-emerald-950 hover:text-white'
                      }`}
                  >
                    {bhk === 'all' ? 'All' : `${bhk} BHK`}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Toggle */}
            <div className="pt-2 border-t border-emerald-950">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Verified Listings Only</span>
                </span>
                <input
                  type="checkbox"
                  suppressHydrationWarning
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>
          </aside>

          {/* Main Property Listings Grid */}
          <main className="md:col-span-2 lg:col-span-3 space-y-6">
            {loading ? (
              <SkeletonGrid count={6} />
            ) : properties.length === 0 ? (
              <div className="bg-[#0a110d] p-12 text-center rounded-3xl border border-emerald-950 shadow-xl space-y-4">
                <div className="w-16 h-16 bg-[#0e261a] text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-800/60">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">No properties matched your filters</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Try expanding your budget range or selecting "All Cities" to view more verified 0% brokerage options.
                </p>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full font-extrabold text-xs shadow-lg transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleProperties.map((property) => (
                    <PropertyCard
                      key={property.id || property.pid}
                      property={property}
                      onContactClick={(p) => {
                        if (!user) {
                          showToast('Please login to contact the property owner');
                          openAuthModal();
                          return;
                        }
                        setSelectedPropertyForInquiry(p);
                      }}
                    />
                  ))}
                </div>

                {/* Manual "Show More Properties" (+21) Pagination Controls */}
                {displayedCount < properties.length ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setDisplayedCount(prev => prev + 21)}
                      className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs rounded-full shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center space-x-2.5"
                    >
                      <span>Show More Properties</span>
                    </button>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="py-10 text-center text-xs text-gray-400 font-semibold border-t border-emerald-950/60 mt-8">
                    ✨ Showing all verified properties in Tricity
                  </div>
                ) : null}
              </>
            )}
          </main>
        </div>

        <div className="mt-16">
          <CallToActionBanner
            subTag="IS READY TO MOVE"
            titleMain="Let's find your"
            titleItalic="perfect space."
            description="Verified homes. Zero brokerage. Hassle-free renting."
            buttonText="Explore Properties"
            buttonHref="/properties"
          />
        </div>

        <InquiryModal
          property={selectedPropertyForInquiry}
          onClose={() => setSelectedPropertyForInquiry(null)}
        />
      </div>
    </div>
  );
}

export default function PropertySearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonGrid count={6} />
      </div>
    }>
      <PropertySearchContent />
    </Suspense>
  );
}
