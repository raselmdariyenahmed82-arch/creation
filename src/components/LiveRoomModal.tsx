import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Heart,
  Gift,
  Send,
  CheckCircle,
  ShieldCheck,
  Radio,
  Sparkles,
  Award,
} from 'lucide-react';
import { LiveStream, LiveChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import confetti from 'canvas-confetti';

interface LiveRoomModalProps {
  stream: LiveStream;
  onClose: () => void;
}

const GIFT_OPTIONS = [
  { name: 'গোলাপ (Rose 🌹)', amount: 20, icon: '🌹' },
  { name: 'স্টার (Star ⭐)', amount: 50, icon: '⭐' },
  { name: 'ফায়ার লাভ (Fire Heart ❤️‍🔥)', amount: 100, icon: '❤️‍🔥' },
  { name: 'কিং ক্রাউন (King Crown 👑)', amount: 500, icon: '👑' },
];

export const LiveRoomModal: React.FC<LiveRoomModalProps> = ({ stream, onClose }) => {
  const { currentUser } = useAuth();
  const [viewerCount, setViewerCount] = useState(stream.viewerCount);
  const [giftsTotal, setGiftsTotal] = useState(stream.giftsTotal || 0);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: 'm1',
      userId: 'u_viewer_1',
      userName: 'Fahim Ahmed',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      message: 'লাইভ ফটো সেশনের ফ্রেম সেটআপ অসাধারণ হইছে আপু! 🔥',
      type: 'CHAT',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm2',
      userId: 'u_viewer_2',
      userName: 'Sabina Yasmin',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      message: 'চিটাগং থেকে দেখতেছি!',
      type: 'CHAT',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'm3',
      userId: 'u_viewer_3',
      userName: 'Kazi Naim',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      message: '🎁 ক্রিয়েটরকে ৳১০০ এর সুপার গিফট পাঠিয়েছেন!',
      type: 'GIFT',
      giftAmount: 100,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setViewerCount((v) => v + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !currentUser) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        message: newMsg.trim(),
        type: 'CHAT',
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewMsg('');
  };

  const handleSendGift = async (gift: (typeof GIFT_OPTIONS)[0]) => {
    if (!currentUser) return;
    setGiftsTotal((g) => g + gift.amount);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `gift_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        message: `🎁 ${currentUser.name} ক্রিয়েটরকে ${gift.name} ৳${gift.amount} পাঠিয়েছেন!`,
        type: 'GIFT',
        giftAmount: gift.amount,
        giftName: gift.name,
        createdAt: new Date().toISOString(),
      },
    ]);

    await DatabaseService.sendLiveGift(
      stream.id,
      stream.hostId,
      gift.amount,
      gift.name,
      currentUser.name
    );

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.7 },
    });

    setShowGiftDrawer(false);
  };

  const triggerHeart = () => {
    const id = Date.now();
    const left = 20 + Math.random() * 60;
    setFloatingHearts((prev) => [...prev, { id, left }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={stream.hostAvatar}
                alt={stream.hostName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-red-500"
              />
              {stream.hostVerified && (
                <CheckCircle className="w-4 h-4 text-sky-400 bg-slate-950 rounded-full absolute -bottom-0.5 -right-0.5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{stream.hostName}</h3>
                {stream.hostRole === 'MAIN_ADMIN' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> মেইন এডমিন
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-md border border-red-800">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1">{stream.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>{viewerCount.toLocaleString()} দর্শক</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Watch & Chat Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Video Stream Stage */}
          <div className="lg:col-span-2 bg-black relative flex flex-col justify-between overflow-hidden">
            {/* Live Video / Stream Simulation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={stream.thumbnailUrl}
                alt="live"
                className="w-full h-full object-cover filter brightness-90 animate-pulse duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </div>

            {/* Floating Hearts Animation */}
            {floatingHearts.map((h) => (
              <div
                key={h.id}
                style={{ left: `${h.left}%` }}
                className="absolute bottom-16 text-2xl animate-fade-out pointer-events-none z-30 transform -translate-x-1/2"
              >
                💖
              </div>
            ))}

            {/* Gifts Total Badge */}
            <div className="relative z-10 p-4 flex items-center justify-between">
              <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 px-3.5 py-1.5 rounded-2xl text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>মোট গিফট অর্জন: ৳{giftsTotal}</span>
              </div>
            </div>

            {/* Bottom Stream Interaction Bar */}
            <div className="relative z-10 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerHeart}
                  className="p-3 bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 border border-pink-500/40 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold shadow-lg backdrop-blur-md"
                >
                  <Heart className="w-5 h-5 fill-current text-pink-500" />
                  <span>লাভ রিঅ্যাকশন</span>
                </button>

                <button
                  onClick={() => setShowGiftDrawer(!showGiftDrawer)}
                  className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition flex items-center gap-1.5 text-xs shadow-xl shadow-amber-500/20"
                >
                  <Gift className="w-5 h-5" />
                  <span>গিফট / টিপ পাঠান 🎁</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                ক্যাটাগরি: <span className="text-slate-200">{stream.category}</span>
              </div>
            </div>

            {/* Gift Options Picker Popup */}
            {showGiftDrawer && (
              <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 z-40 bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 p-4 rounded-3xl shadow-2xl sm:w-80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> ক্রিয়েটরকে গিফট পাঠান
                  </h4>
                  <button
                    onClick={() => setShowGiftDrawer(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {GIFT_OPTIONS.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => handleSendGift(g)}
                      className="p-2.5 bg-slate-950 hover:bg-amber-500/15 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition flex flex-col items-center text-center gap-1"
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-[11px] font-semibold text-slate-200">{g.name}</span>
                      <span className="text-xs font-bold text-amber-400">৳{g.amount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Chat Column */}
          <div className="bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">লাইভ কমেন্ট ও রিঅ্যাকশন</span>
              <span className="text-[10px] text-sky-400 font-semibold bg-sky-950 px-2 py-0.5 rounded-md border border-sky-800">
                রিয়েল-টাইম
              </span>
            </div>

            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl text-xs ${
                    msg.type === 'GIFT'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200'
                      : 'bg-slate-950/60 border border-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold text-[11px] text-slate-400">
                    <span>{msg.userName}</span>
                    {msg.type === 'GIFT' && (
                      <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded-full">
                        GIFT ৳{msg.giftAmount}
                      </span>
                    )}
                  </div>
                  <p className="leading-snug">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="লাইভ কমেন্ট করুন..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-rose-500 outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
