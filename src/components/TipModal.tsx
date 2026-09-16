import React, { useState } from 'react';
import {
  Gift,
  X,
  Sparkles,
  CheckCircle,
  Heart,
  DollarSign,
} from 'lucide-react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import confetti from 'canvas-confetti';

interface TipModalProps {
  post: Post;
  onClose: () => void;
}

const TIP_TIERS = [
  { amount: 20, label: 'কফি কাপ ☕ (৳২০)' },
  { amount: 50, label: 'সুপার লাভ 💖 (৳৫০)' },
  { amount: 100, label: 'ফায়ার গিফট 🔥 (৳১০০)' },
  { amount: 500, label: 'গোল্ডেন স্টার ⭐ (৳৫০০)' },
];

export const TipModal: React.FC<TipModalProps> = ({ post, onClose }) => {
  const { currentUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customMsg, setCustomMsg] = useState('আপনার কনটেন্ট অনেক দারুণ হয়েছে!');
  const [isSending, setIsSending] = useState(false);

  const handleSendTip = async () => {
    if (!currentUser) return;
    setIsSending(true);

    // Add gift amount directly to post author's balance
    const updatedUsers = await DatabaseService.recordViewAndEarn(post.id, post.userId, selectedAmount * 1000);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    alert(`৳${selectedAmount} সফলভাবে ${post.authorName} এর ক্রিয়েটর ওয়ালেটে পাঠানো হয়েছে! 🎉`);
    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Gift className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">ক্রিয়েটরকে টিপ বা গিফট পাঠান</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator Info */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-amber-400"
          />
          <div>
            <span className="text-xs font-bold text-white block">{post.authorName}</span>
            <span className="text-[11px] text-slate-400">@{post.authorUsername}</span>
          </div>
        </div>

        {/* Tier Select */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            টিপ পরিমাণ নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIP_TIERS.map((tier) => (
              <button
                key={tier.amount}
                onClick={() => setSelectedAmount(tier.amount)}
                className={`p-3 rounded-2xl border text-xs font-bold transition text-left ${
                  selectedAmount === tier.amount
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            শুভেচ্ছা বার্তা (Message):
          </label>
          <input
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={handleSendTip}
          disabled={isSending}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-xl shadow-amber-500/20 disabled:opacity-50"
        >
          {isSending ? 'পাঠানো হচ্ছে...' : `৳${selectedAmount} টিপ পাঠান 🎁`}
        </button>
      </div>
    </div>
  );
};
