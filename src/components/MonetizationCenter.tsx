import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  CreditCard,
  Building,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { WithdrawalRequest } from '../types';
import confetti from 'canvas-confetti';

export const MonetizationCenter: React.FC = () => {
  const { currentUser, isMainAdmin } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'PayPal'>('bKash');
  const [accountNumber, setAccountNumber] = useState(currentUser?.paymentInfo?.accountNumber || '017XXXXXXXX');
  const [accountHolder, setAccountHolder] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calcViews, setCalcViews] = useState(50000);

  useEffect(() => {
    const unsub = DatabaseService.subscribeWithdrawals((list) => {
      setWithdrawals(list);
    });
    return () => unsub();
  }, []);

  const userWithdrawals = isMainAdmin
    ? withdrawals
    : withdrawals.filter((w) => w.userId === currentUser?.id);

  const balance = currentUser?.wallet?.balance || 0;
  const totalEarned = currentUser?.wallet?.totalEarned || 0;
  const pendingWithdrawal = currentUser?.wallet?.pendingWithdrawal || 0;
  const cpmRate = currentUser?.wallet?.cpmRate || 75;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (withdrawAmount < 200) {
      alert('নূন্যতম উইথড্র পরিমাণ ২০০ ৳');
      return;
    }

    if (withdrawAmount > balance) {
      alert('আপনার পর্যাপ্ত ওয়ালেট ব্যালেন্স নেই!');
      return;
    }

    if (!accountNumber.trim()) {
      alert('অনুগ্রহ করে একাউন্ট নাম্বার প্রদান করুন!');
      return;
    }

    setIsSubmitting(true);

    const newReq: WithdrawalRequest = {
      id: `wdr_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount: withdrawAmount,
      paymentMethod: paymentMethod,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    await DatabaseService.requestWithdrawal(newReq);

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.6 },
    });

    alert('উইথড্র রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! মেইন অ্যাডমিন ভেরিফাই করে টাকা পাঠিয়ে দেবে।');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <DollarSign className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> ক্রিয়েটর রেভিনিউ হাব (Creator Revenue)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            ভিডিও ও ফটো ভিউ থেকে আয় করুন সরাসরি ওয়ালেটে 💸
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            আপনার প্রতি ১,০০০ ভিউ এর জন্য নির্ধারিত CPM রেটে টাকা স্বয়ংক্রিয়ভাবে জমা হবে। অর্জিত টাকা সরাসরি bKash, Nagad, Rocket বা ব্যাংক একাউন্টে ট্রান্সফার করুন।
          </p>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>উত্তোলনযোগ্য ব্যালেন্স (Available)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            ৳{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-500/80 font-medium">ইনস্ট্যান্ট উইথড্র উপযোগী</span>
        </div>

        {/* Total Earned */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>সর্বমোট আয় (Lifetime Earning)</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ৳{totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-sky-400/80 font-medium">ভিডিও ভিউ ও লাইভ গিফট</span>
        </div>

        {/* Pending Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>পেন্ডিং উত্তোলন (Pending)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            ৳{pendingWithdrawal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-500/80 font-medium">অ্যাডমিন প্রসেসিংয়ে রয়েছে</span>
        </div>

        {/* CPM Rate */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>আপনার ভিউ CPM রেট</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400">
            ৳{cpmRate} <span className="text-sm font-normal text-slate-400">/ 1K ভিউ</span>
          </div>
          <span className="text-[11px] text-purple-400/80 font-medium">হাই-অ্যাক্টিভ ক্রিয়েটর বোনাস</span>
        </div>
      </div>

      {/* Main Grid: Withdraw Form & Earnings Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cashout Withdrawal Form */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                টাকা উত্তোলন করুন (Withdraw Earnings)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্টে পেমেন্ট রিকোয়েস্ট পাঠান
              </p>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                পেমেন্ট মেথড নির্বাচন করুন (Payment Gateway) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'bKash', label: 'bKash (বিকাশ)', color: 'border-pink-500 text-pink-400' },
                  { id: 'Nagad', label: 'Nagad (নগদ)', color: 'border-orange-500 text-orange-400' },
                  { id: 'Rocket', label: 'Rocket (রকেট)', color: 'border-purple-500 text-purple-400' },
                  { id: 'Bank', label: 'Bank Transfer', color: 'border-sky-500 text-sky-400' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition text-center flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === m.id
                        ? `bg-slate-800 ${m.color} ring-2 ring-emerald-500/50`
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  উত্তোলনের পরিমাণ (Amount in BDT ৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min={200}
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">নূন্যতম ২০০ ৳ | সর্বোচ্চ ৳{balance}</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  একাউন্ট / মোবাইল নম্বর (Account Number) *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Account Holder */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                একাউন্ট হোল্ডারের নাম (Account Holder Name)
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="আপনার নাম..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || balance < 200}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'উইথড্র রিকোয়েস্ট পাঠান (Submit Cashout) 💸'}
            </button>
          </form>
        </div>

        {/* Right 1 Col: View Earning Estimator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              ভিউ ইনকাম ক্যালকুলেটর
            </h3>
            <p className="text-xs text-slate-400">
              আপনার সম্ভাব্য ভিউ এর ভিত্তিতে মাসিক আয়ের হিসাব দেখুন
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                <span>অনুমানিত মোট ভিউ:</span>
                <span className="text-sky-400 font-bold">{calcViews.toLocaleString()} ভিউ</span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={calcViews}
                onChange={(e) => setCalcViews(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>বর্তমান CPM রেট:</span>
                <span className="text-slate-200 font-semibold">৳{cpmRate} / 1K</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>প্ল্যাটফর্ম ফি:</span>
                <span className="text-emerald-400 font-semibold">০% (ফ্রি)</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-200">সম্ভাব্য মোট আয়:</span>
                <span className="text-xl font-black text-emerald-400">
                  ৳{((calcViews / 1000) * cpmRate).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300 leading-relaxed">
            💡 <strong>টিপস:</strong> নিয়মিত এইচডি ভিডিও এবং ফটোসেশন পোস্ট করলে ও লাইভ স্ট্রিমে ভক্তদের সাথে যুক্ত থাকলে ভিউ আর্নিং ৩ গুণ পর্যন্ত বৃদ্ধি পেতে পারে।
          </div>
        </div>
      </div>

      {/* Withdrawal History List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          উইথড্রয়াল হিস্ট্রি ও ট্রানজেকশন (Payout History)
        </h3>

        {userWithdrawals.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            এখনও কোনো উইথড্র রিকোয়েস্ট নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">আইডি ও তারিখ</th>
                  <th className="p-3.5">পদ্ধতি ও একাউন্ট</th>
                  <th className="p-3.5">পরিমাণ</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5 rounded-r-xl">ট্রানজেকশন আইডি / নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="font-bold text-slate-200">{w.id}</div>
                      <div className="text-slate-500 text-[10px]">{new Date(w.requestedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-white">{w.paymentMethod}</span>
                      <div className="text-slate-400 text-[11px]">{w.accountNumber} ({w.userName})</div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400 text-sm">
                      ৳{w.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      {w.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> পেইড (Approved)
                        </span>
                      )}
                      {w.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-semibold text-[10px]">
                          <Clock className="w-3 h-3" /> প্রসেসিং (Pending)
                        </span>
                      )}
                      {w.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full font-semibold text-[10px]">
                          <XCircle className="w-3 h-3" /> বাতিল (Rejected)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {w.transactionId && (
                        <span className="font-mono text-sky-400 font-medium block">
                          TRX: {w.transactionId}
                        </span>
                      )}
                      {w.adminNote && <span>{w.adminNote}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
