import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Radio,
  Users,
  Heart,
  Gift,
  Send,
  X,
  Sparkles,
  Award,
  DollarSign,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { LiveStream, LiveChatMessage } from '../types';
import confetti from 'canvas-confetti';

interface LiveStudioProps {
  onClose: () => void;
}

export const LiveStudio: React.FC<LiveStudioProps> = ({ onClose }) => {
  const { currentUser, isMainAdmin } = useAuth();

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [streamTitle, setStreamTitle] = useState('🔴 লাইভ ফটো সেশন ও স্পেশাল ক্রিয়েটর আড্ডা!');
  const [category, setCategory] = useState('Photoshoot & Lifestyle');
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [giftsEarned, setGiftsEarned] = useState(0);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Initialize camera preview
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable, using virtual simulator:', err);
      }
    }
    setupCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    } else {
      setCameraActive(!cameraActive);
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    } else {
      setMicActive(!micActive);
    }
  };

  const startBroadcast = async () => {
    if (!currentUser) return;
    const streamId = `live_${Date.now()}`;
    const newStream: LiveStream = {
      id: streamId,
      hostId: currentUser.id,
      hostName: currentUser.name,
      hostUsername: currentUser.username,
      hostAvatar: currentUser.avatarUrl,
      hostRole: currentUser.role,
      hostVerified: currentUser.isVerified,
      title: streamTitle,
      category: category,
      status: 'LIVE',
      viewerCount: 142,
      peakViewers: 142,
      thumbnailUrl: currentUser.avatarUrl,
      giftsTotal: 0,
      startedAt: new Date().toISOString(),
    };

    setActiveStreamId(streamId);
    setIsBroadcasting(true);
    setViewerCount(142);
    setPeakViewers(142);

    await DatabaseService.createLiveStream(newStream);

    // Initial system message
    setChatMessages([
      {
        id: 'sys_1',
        userId: 'system',
        userName: 'System Bot',
        userAvatar: '',
        message: '🔴 লাইভ ব্রডকাস্ট শুরু হয়েছে! ক্রিয়েটরকে গিফট ও কমেন্ট পাঠাতে পারেন।',
        type: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  // Simulate incoming live viewers & interactive comments while broadcasting
  useEffect(() => {
    if (!isBroadcasting) return;

    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.floor(Math.random() * 15) - 4;
        const next = Math.max(80, prev + delta);
        setPeakViewers((p) => Math.max(p, next));
        return next;
      });
    }, 4000);

    const mockNames = ['Rahim Sheikh', 'Sabina Yasmin', 'Fahim Tech', 'Nusrat Jahan', 'Kazi Arman', 'Mehedi Hasan'];
    const mockMsgs = [
      'সাউন্ড এবং ভিডিও কোয়ালিটি সেই লেভেলের! 🔥',
      'আপনার নেক্সট ফটো সেশন কবে ভাইয়া?',
      'অসাধারণ লাইভ স্ট্রিম হচ্ছে 💖',
      'ঢাকা থেকে দেখতেছি!',
      'গিফট পাঠালাম ভাইয়া 🎁',
    ];

    const chatInterval = setInterval(() => {
      const randomUser = mockNames[Math.floor(Math.random() * mockNames.length)];
      const randomMsg = mockMsgs[Math.floor(Math.random() * mockMsgs.length)];
      const isGift = Math.random() > 0.75;
      const giftAmount = isGift ? [20, 50, 100, 200][Math.floor(Math.random() * 4)] : 0;

      if (isGift && currentUser && activeStreamId) {
        setGiftsEarned((g) => g + giftAmount);
        DatabaseService.sendLiveGift(activeStreamId, currentUser.id, giftAmount, 'Live Gift', randomUser);
      }

      setChatMessages((prev) => [
        ...prev.slice(-40),
        {
          id: `msg_${Date.now()}`,
          userId: `u_${Math.random()}`,
          userName: randomUser,
          userAvatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
          message: isGift ? `🎁 ক্রিয়েটরকে ৳${giftAmount} এর সুপার গিফট পাঠিয়েছেন!` : randomMsg,
          type: isGift ? 'GIFT' : 'CHAT',
          giftAmount: giftAmount,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 5000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(chatInterval);
    };
  }, [isBroadcasting, currentUser, activeStreamId]);

  const endBroadcast = async () => {
    if (activeStreamId) {
      await DatabaseService.endLiveStream(activeStreamId);
    }
    setIsBroadcasting(false);
    setShowSummary(true);
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                লাইভ ব্রডকাস্টিং স্টুডিও (Live Studio)
                {isBroadcasting && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                    LIVE
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                ক্যামেরা ও মাইক অন করে সরাসরি অডিয়েন্সের সাথে লাইভ কানেক্ট হোন এবং ইনস্ট্যান্ট গিফট অর্জন করুন
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isBroadcasting) {
                if (window.confirm('লাইভ স্ট্রিম শেষ করতে চান?')) {
                  endBroadcast();
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Main Video Stage (Left 2 cols) */}
          <div className="lg:col-span-2 bg-black relative flex flex-col justify-between p-4 overflow-hidden">
            {/* Live Camera View */}
            <div className="absolute inset-0 flex items-center justify-center">
              {cameraActive ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <VideoOff className="w-12 h-12" />
                  <span className="text-sm">ক্যামেরা বন্ধ রয়েছে</span>
                </div>
              )}
            </div>

            {/* Overlays on top of video */}
            <div className="relative z-10 flex items-center justify-between">
              {isBroadcasting ? (
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white uppercase">LIVE</span>
                  <span className="text-slate-500">•</span>
                  <div className="flex items-center gap-1 text-xs text-slate-300">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>{viewerCount.toLocaleString()} জন দেখছে</span>
                  </div>
                </div>
              ) : (
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-xs text-slate-300">
                  📷 ক্যামেরা প্রিভিউ মোড
                </div>
              )}

              {/* Live Gifts Earned Pill */}
              {isBroadcasting && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 px-3.5 py-1.5 rounded-2xl text-amber-300 text-xs font-bold">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>+৳{giftsEarned} লাইভ গিফট</span>
                </div>
              )}
            </div>

            {/* Controls at bottom of video stage */}
            <div className="relative z-10 flex items-center justify-between bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-xl font-semibold transition ${
                    cameraActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                  }`}
                  title="ক্যামেরা অন/অফ"
                >
                  {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl font-semibold transition ${
                    micActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                  }`}
                  title="মাইক্রোফোন অন/অফ"
                >
                  {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              </div>

              {!isBroadcasting ? (
                <button
                  onClick={startBroadcast}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-red-600/30 transition transform hover:scale-105"
                >
                  <Radio className="w-4 h-4" />
                  লাইভ শুরু করুন (Go Live)
                </button>
              ) : (
                <button
                  onClick={endBroadcast}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl transition"
                >
                  লাইভ শেষ করুন (End Stream)
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Settings & Live Chat */}
          <div className="bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
            {!isBroadcasting ? (
              <div className="p-5 space-y-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  স্ট্রিম কনফিগারেশন (Stream Setup)
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    লাইভ স্ট্রিম টাইটেল (Title)
                  </label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-rose-500 outline-none"
                    placeholder="টাইটেল লিখুন..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    ক্যাটাগরি (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-rose-500 outline-none"
                  >
                    <option value="Photoshoot & Lifestyle">Photoshoot & Lifestyle 📸</option>
                    <option value="Creative Video & BTS">Creative Video & BTS 🎬</option>
                    <option value="Creator Q&A & ChitChat">Creator Q&A & ChitChat 💬</option>
                    <option value="Tech & Monetization Guide">Tech & Monetization Guide 💸</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span>ইনস্ট্যান্ট লাইভ ইনকাম চালু রয়েছে</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ভিউয়াররা লাইভে কমেন্ট করার পাশাপাশি bKash/Nagad সমর্থিত কয়েন ও গিফট পাঠাতে পারবে যা সরাসরি আপনার ওয়ালেটে জমা হবে।
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Live Chat Title */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">রিয়েল-টাইম লাইভ চ্যাট ({chatMessages.length})</span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                    কানেক্টেড
                  </span>
                </div>

                {/* Messages List */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        msg.type === 'GIFT'
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200'
                          : msg.type === 'SYSTEM'
                          ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                          : 'bg-slate-950/60 border border-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 font-semibold text-[11px] text-slate-400">
                        <span>{msg.userName}</span>
                        {msg.type === 'GIFT' && (
                          <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded-full">
                            GIFT
                          </span>
                        )}
                      </div>
                      <p className="leading-snug">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Send Chat */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="কমেন্ট লিখুন..."
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
            )}
          </div>
        </div>
      </div>

      {/* End Stream Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">লাইভ স্ট্রিম সফলভাবে শেষ হয়েছে! 🎉</h3>
            
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">সর্বোচ্চ ভিউয়ার</span>
                <span className="text-lg font-bold text-sky-400">{peakViewers.toLocaleString()}</span>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">মোট অর্জিত গিফট</span>
                <span className="text-lg font-bold text-emerald-400">৳{giftsEarned}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              অর্জিত অর্থ আপনার ক্রিয়েটর ওয়ালেটে সফলভাবে যোগ করা হয়েছে।
            </p>

            <button
              onClick={() => {
                setShowSummary(false);
                onClose();
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
