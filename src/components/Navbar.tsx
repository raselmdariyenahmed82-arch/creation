import React, { useState } from 'react';
import {
  Radio,
  PlusCircle,
  Wallet,
  ShieldCheck,
  Code,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MAIN_ADMIN_EMAIL } from '../lib/firebase';

interface NavbarProps {
  currentView: 'FEED' | 'MONETIZATION' | 'ADMIN' | 'SOURCE_CODE';
  setCurrentView: (v: 'FEED' | 'MONETIZATION' | 'ADMIN' | 'SOURCE_CODE') => void;
  onOpenLiveStudio: () => void;
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenLiveStudio,
  onOpenCreateModal,
  onOpenAuthModal,
}) => {
  const { currentUser, isMainAdmin, isSideAdmin, logout, users, switchProfile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const balance = currentUser?.wallet?.balance || 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentView('FEED')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CreatorStream
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-rose-400 block -mt-1 tracking-wider uppercase">
                Social & View Earn
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentView('FEED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentView === 'FEED'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              ফিড এক্সপ্লোর
            </button>

            <button
              onClick={() => setCurrentView('MONETIZATION')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentView === 'MONETIZATION'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              ওয়ালেট ও ইনকাম (৳)
            </button>

            <button
              onClick={() => setCurrentView('SOURCE_CODE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentView === 'SOURCE_CODE'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Code className="w-4 h-4 text-sky-400" />
              সোর্স ফাইল (Source)
            </button>

            {(isMainAdmin || isSideAdmin) && (
              <button
                onClick={() => setCurrentView('ADMIN')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  currentView === 'ADMIN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                মেইন এডমিন প্যানেল
              </button>
            )}
          </nav>
        </div>

        {/* Right Action Buttons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Go Live Button */}
          <button
            onClick={onOpenLiveStudio}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition transform hover:scale-105"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">লাইভ স্ট্রিম</span> (Live)
          </button>

          {/* Create Post Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">পোস্ট করুন</span> (Create)
          </button>

          {/* Earnings Badge Click */}
          <button
            onClick={() => setCurrentView('MONETIZATION')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl text-xs font-extrabold text-emerald-400 transition"
            title="আপনার ওয়ালেট ব্যালেন্স"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>৳{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-900 border border-slate-800 transition"
            >
              <div className="relative">
                <img
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/40"
                />
                {currentUser?.isVerified && (
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400 bg-slate-950 rounded-full absolute -bottom-0.5 -right-0.5" />
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-3">
                <div className="pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white line-clamp-1">{currentUser?.name}</span>
                    {currentUser?.role === 'MAIN_ADMIN' && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-extrabold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block">{currentUser?.email}</span>
                </div>

                {/* Quick Profile Switch */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-1">
                    ইউজার প্রোফাইল পরিবর্তন:
                  </span>
                  {users.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchProfile(u.id);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-1.5 rounded-xl text-xs transition ${
                        currentUser?.id === u.id
                          ? 'bg-rose-600/20 text-rose-300 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{u.name}</span>
                      <span className="text-[10px] opacity-70">
                        {u.role === 'MAIN_ADMIN' ? '👑 Admin' : u.role === 'SIDE_ADMIN' ? '🛡️ Side' : 'Creator'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      onOpenAuthModal();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> অ্যাকাউন্ট সুইচ / লগইন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-slate-950 border-b border-slate-800 space-y-2">
          <button
            onClick={() => {
              setCurrentView('FEED');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              currentView === 'FEED' ? 'bg-rose-600 text-white' : 'text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" /> ফিড এক্সপ্লোর
          </button>
          <button
            onClick={() => {
              setCurrentView('MONETIZATION');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              currentView === 'MONETIZATION' ? 'bg-emerald-600 text-white' : 'text-slate-300'
            }`}
          >
            <Wallet className="w-4 h-4" /> ওয়ালেট ও ইনকাম (৳{balance.toFixed(0)})
          </button>
          <button
            onClick={() => {
              setCurrentView('SOURCE_CODE');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              currentView === 'SOURCE_CODE' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            <Code className="w-4 h-4" /> সোর্স ফাইল (Source Files)
          </button>
          {(isMainAdmin || isSideAdmin) && (
            <button
              onClick={() => {
                setCurrentView('ADMIN');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                currentView === 'ADMIN' ? 'bg-amber-600 text-white' : 'text-amber-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> মেইন এডমিন প্যানেল
            </button>
          )}
        </div>
      )}
    </header>
  );
};
