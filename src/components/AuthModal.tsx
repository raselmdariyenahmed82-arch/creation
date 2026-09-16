import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  Mail,
  User,
  Lock,
  Camera,
  CheckCircle,
  ArrowRight,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MAIN_ADMIN_EMAIL } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login, signup, switchProfile, users } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<'CREATOR' | 'SIDE_ADMIN' | 'VIEWER'>('CREATOR');

  const handleQuickLogin = async (targetEmail: string) => {
    const success = await login(targetEmail);
    if (success) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
      });
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (mode === 'LOGIN') {
      const ok = await login(email.trim());
      if (ok) onClose();
    } else {
      const ok = await signup({
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        username: username.trim() || email.split('@')[0].toLowerCase(),
        bio: bio.trim(),
        role: role,
      });
      if (ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'LOGIN' ? 'একাউন্টে প্রবেশ করুন (Sign In)' : 'নতুন ক্রিয়েটর একাউন্ট তৈরি করুন'}
              </h3>
              <p className="text-xs text-slate-400">সোশ্যাল মিডিয়া ও ভিউ আর্নিং প্ল্যাটফর্ম</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Quick 1-Click Profile Switch Section */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                ১-ক্লিকে টেস্ট প্রোফাইল লগইন (Quick Access):
              </span>
            </div>

            <div className="space-y-2">
              {/* Main Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin(MAIN_ADMIN_EMAIL)}
                className="w-full p-2.5 bg-gradient-to-r from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center text-sm font-bold">
                    👑
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      মেইন এডমিন (Main Admin)
                      <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-extrabold">
                        SUPER
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{MAIN_ADMIN_EMAIL}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Creator 1 */}
              <button
                type="button"
                onClick={() => handleQuickLogin('tania.vlogs@gmail.com')}
                className="w-full p-2.5 bg-slate-900/60 border border-slate-800 hover:border-pink-500/40 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-pink-500/30 text-pink-300 flex items-center justify-center text-sm font-bold">
                    📸
                  </div>
                  <div>
                    <div className="text-xs font-bold text-pink-300">তানিয়া রহমান (টপ মডেল ও ক্রিয়েটর)</div>
                    <div className="text-[11px] text-slate-400 font-mono">tania.vlogs@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Creator 2 (Side Admin) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('arafat.tech@gmail.com')}
                className="w-full p-2.5 bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-sm font-bold">
                    🎥
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-300">আরাফাত হোসেন (সাইড এডমিন)</div>
                    <div className="text-[11px] text-slate-400 font-mono">arafat.tech@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-semibold absolute">
              বা ইমেইল দিয়ে প্রবেশ করুন
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ইমেইল এড্রেস (Email Address) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {mode === 'SIGNUP' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      পূর্ণ নাম (Full Name)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="নাম লিখুন..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      ইউজারনেম (Username)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    বায়ো / ডেসক্রিপশন (Bio)
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="যেমন: ফ্যাশন ও লাইফস্টাইল ক্রিয়েটর 📸"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    একাউন্ট ক্যাটাগরি / ভূমিকা (Account Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('CREATOR')}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        role === 'CREATOR'
                          ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm">🎬 ক্রিয়েটর</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">ভিডিও, ফটো ও ভিউ আর্নিং</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('SIDE_ADMIN')}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        role === 'SIDE_ADMIN'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-sm">🛡️ সাইড এডমিন</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">সাইট মডারেশন ও ক্রিয়েটর আইডি</div>
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-300/80 mt-1.5 leading-relaxed">
                    💡 <strong>মেইন এডমিন নিয়ম:</strong> সাইড এডমিন আইডি খুললে সাইট এডমিন ভূমিকা পাবেন। মূল মেইন এডমিন ক্ষমতা শুধুমাত্র প্রধান ইমেইল ({MAIN_ADMIN_EMAIL}) থেকে অথবা মেইন এডমিনের অনুমোদনে প্রদান করা হয়।
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-rose-600/30"
            >
              {mode === 'LOGIN' ? 'লগইন করুন (Continue)' : 'একাউন্ট তৈরি করুন (Create Account)'}
            </button>
          </form>

          {/* Toggle login / signup */}
          <div className="text-center pt-2">
            <button
              onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
              className="text-xs text-rose-400 hover:underline"
            >
              {mode === 'LOGIN'
                ? 'নতুন ক্রিয়েটর? একাউন্ট তৈরি করতে এখানে ক্লিক করুন'
                : 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
