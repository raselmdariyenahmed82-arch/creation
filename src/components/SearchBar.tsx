import React from 'react';
import {
  Search,
  Video,
  Camera,
  Radio,
  TrendingUp,
  Sparkles,
  X,
  Tag,
} from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: 'ALL' | 'VIDEOS' | 'PHOTOS' | 'LIVE' | 'EARNINGS';
  setActiveFilter: (f: 'ALL' | 'VIDEOS' | 'PHOTOS' | 'LIVE' | 'EARNINGS') => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

const POPULAR_TAGS = [
  'monetization',
  'creatorstudio',
  'photoshoot',
  'goldenhour',
  'cinematic',
  '4k',
  'drone',
  'tutorial',
  'bts',
  'neon',
  'model',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  selectedTag,
  setSelectedTag,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ভিডিও, ফটো সেশন, ক্রিয়েটর বা ট্যাগ খুঁজুন... (Search videos, photos, creators, tags)"
          className="w-full bg-slate-900/90 border border-slate-800 focus:border-rose-500/80 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-slate-100 placeholder-slate-400 outline-none transition-all shadow-inner focus:ring-2 focus:ring-rose-500/20 backdrop-blur-md"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Quick Tags */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setSelectedTag(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'ALL' && !selectedTag
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            সব কনটেন্ট (All)
          </button>

          <button
            onClick={() => setActiveFilter('VIDEOS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'VIDEOS'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-red-400" />
            ভিডিও (Videos)
          </button>

          <button
            onClick={() => setActiveFilter('PHOTOS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'PHOTOS'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            ফটো সেশন (Photosets)
          </button>

          <button
            onClick={() => setActiveFilter('LIVE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'LIVE'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/50'
                : 'bg-slate-900/80 text-red-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <Radio className="w-3.5 h-3.5" />
            লাইভ (Live Now)
          </button>

          <button
            onClick={() => setActiveFilter('EARNINGS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'EARNINGS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900/80 text-emerald-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            টপ আর্নিং (Top Earners ৳)
          </button>
        </div>

        {/* Popular Tags Pills */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <Tag className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400 text-xs">জনপ্রিয়:</span>
          {POPULAR_TAGS.slice(0, 5).map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (selectedTag === tag) {
                  setSelectedTag(null);
                } else {
                  setSelectedTag(tag);
                  setActiveFilter('ALL');
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                selectedTag === tag
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
