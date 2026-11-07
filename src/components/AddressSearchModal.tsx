import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Navigation,
  X,
  ArrowLeft,
  Loader2,
  Plane,
  Building,
  Flame,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Target
} from 'lucide-react';
import { Location, DestinationFilter } from '../types';
import { searchRealAddresses, GeocodedAddress, calculateDistanceMiles, estimateDriveMinutes } from '../utils/geocoding';

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverLocation: Location | null;
  activeDestinationFilter: DestinationFilter | null;
  onSelectDestination: (dest: GeocodedAddress) => void;
  onClearDestination: () => void;
  theme?: 'dark' | 'light';
}

type CategoryType = 'all' | 'airports' | 'stations' | 'surge' | 'landmarks';

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  isOpen,
  onClose,
  driverLocation,
  activeDestinationFilter,
  onSelectDestination,
  onClearDestination,
  theme = 'dark'
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryType>('all');
  const [results, setResults] = useState<GeocodedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced real-time geocoding search
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      // Show default initial recommendations
      setIsLoading(true);
      searchRealAddresses('airport', driverLocation).then((res) => {
        setResults(res.slice(0, 6));
        setIsLoading(false);
        setHasSearched(false);
      });
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchRealAddresses(trimmed, driverLocation);
        setResults(found);
        setHasSearched(true);
      } catch (e) {
        console.error('Error during address search:', e);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen, driverLocation]);

  if (!isOpen) return null;

  // Filter results by category if selected
  const filteredResults = results.filter((item) => {
    if (category === 'all') return true;
    if (category === 'airports') return item.type === 'airport';
    if (category === 'stations') return item.type === 'station';
    if (category === 'surge') return item.type === 'commercial' || item.type === 'city';
    if (category === 'landmarks') return item.type === 'landmark';
    return true;
  });

  const getCategoryIcon = (type: GeocodedAddress['type']) => {
    switch (type) {
      case 'airport':
        return <Plane size={18} className="text-cyan-400" />;
      case 'station':
        return <Navigation size={18} className="text-amber-400" />;
      case 'landmark':
        return <Building size={18} className="text-purple-400" />;
      case 'commercial':
        return <Flame size={18} className="text-red-400" />;
      default:
        return <MapPin size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-[5300] flex items-start justify-center p-3 sm:p-5 pt-8 sm:pt-14 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -30, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="w-full max-w-xl rounded-[32px] p-5 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative z-10 border border-white/10 bg-[#0a0c14] text-white flex flex-col max-h-[86vh] overflow-hidden"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Map</span>
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
                <Target size={16} className="text-blue-400" />
                <span>Search Destination</span>
              </h2>
              <p className="text-[10px] text-gray-400 font-bold">Route & filter trip offers toward your area</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Destination Filter Warning / Clear Banner */}
        {activeDestinationFilter?.active && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 text-emerald-200 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="truncate">
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Active Destination Filter</p>
                <p className="text-xs font-black text-white truncate">{activeDestinationFilter.shortName}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClearDestination();
                onClose();
              }}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Real Address Search Input */}
        <div className="relative mb-3 shrink-0">
          <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl transition-all">
            {isLoading ? (
              <Loader2 size={20} className="text-blue-400 animate-spin shrink-0" />
            ) : (
              <Search size={20} className="text-blue-400 shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredResults.length > 0) {
                  onSelectDestination(filteredResults[0]);
                  onClose();
                }
              }}
              placeholder="Enter real address, street, landmark, or postcode..."
              className="flex-1 bg-transparent border-none outline-none font-bold text-sm sm:text-base text-white placeholder-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 custom-scrollbar shrink-0">
          {[
            { id: 'all', label: 'All Addresses' },
            { id: 'airports', label: '✈️ Airports' },
            { id: 'stations', label: '🚆 Rail Stations' },
            { id: 'surge', label: '🔥 Commercial' },
            { id: 'landmarks', label: '🏛️ Landmarks' }
          ].map((cat) => (
            <button
              key={`cat-btn-${cat.id}`}
              onClick={() => setCategory(cat.id as CategoryType)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                category === cat.id
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
          {isLoading && filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-gray-400">
              <Loader2 size={36} className="text-blue-500 animate-spin mb-3" />
              <p className="text-sm font-black text-white">Searching real-world geocoding database...</p>
              <p className="text-xs text-gray-500 mt-1">Fetching road coordinates & address geometry</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <Compass size={36} className="mb-2 opacity-40 text-blue-400" />
              <p className="font-black text-sm text-white">No addresses matched "{query}"</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Try typing a street name, postcode (e.g. "TW6 2GA", "SW1A 1AA"), city, or landmark like "Heathrow", "Tower Bridge", or "221B Baker St".
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => (
              <div
                key={`search-addr-${item.id || 'res'}-${idx}`}
                onClick={() => {
                  onSelectDestination(item);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-white leading-tight truncate group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                      {item.subtitle}
                    </p>
                    {item.distanceMi !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-blue-400 flex items-center gap-1">
                          <Navigation size={10} />
                          <span>{item.distanceMi} mi away</span>
                        </span>
                        {item.estimatedMinutes && (
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            <span>~{item.estimatedMinutes} mins</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDestination(item);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-[#0066ff] hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  <Target size={13} className="text-white" />
                  <span>Navigate & Get Jobs 🚗</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Helper Bar */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 shrink-0">
          <span className="flex items-center gap-1 font-bold">
            <Zap size={11} className="text-amber-400" />
            <span>Destination Mode: Only dispatches jobs heading towards destination</span>
          </span>
          <span className="text-gray-500 hidden sm:inline">OpenStreetMap Geocoding</span>
        </div>
      </motion.div>
    </div>
  );
};
