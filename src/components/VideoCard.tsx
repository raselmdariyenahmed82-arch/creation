import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Eye,
  CheckCircle,
  ShieldCheck,
  Gift,
  MoreVertical,
  Trash2,
  Flag,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import confetti from 'canvas-confetti';

interface VideoCardProps {
  post: Post;
  onOpenComments: (post: Post) => void;
  onOpenTipModal: (post: Post) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  post,
  onOpenComments,
  onOpenTipModal,
}) => {
  const { currentUser, isMainAdmin, isSideAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(
    currentUser ? post.likedBy?.includes(currentUser.id) : false
  );
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const [earnings, setEarnings] = useState(post.monetization?.earnings || 0);
  const [showEarnToast, setShowEarnToast] = useState(false);
  const [earnedAmountToast, setEarnedAmountToast] = useState(0);
  const [hasEarnedFromThisView, setHasEarnedFromThisView] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLikesCount(post.likesCount);
    setIsLiked(currentUser ? post.likedBy?.includes(currentUser.id) : false);
    setViewsCount(post.viewsCount);
    setEarnings(post.monetization?.earnings || 0);
  }, [post, currentUser]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        triggerViewEarning();
      }).catch((e) => console.warn('Autoplay prevented:', e));
    }
  };

  const triggerViewEarning = async () => {
    if (hasEarnedFromThisView) return;
    setHasEarnedFromThisView(true);

    const res = await DatabaseService.recordViewAndEarn(post.id, post.userId, post.monetization?.cpm);
    setViewsCount((prev) => prev + 1);
    setEarnings((prev) => Math.round((prev + res.earned) * 100) / 100);
    setEarnedAmountToast(res.earned);
    setShowEarnToast(true);

    setTimeout(() => {
      setShowEarnToast(false);
    }, 3500);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    await DatabaseService.likePost(post.id, currentUser.id);

    if (newLiked) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('আপনি কি নিশ্চিত এই ভিডিওটি ডিলিট করতে চান?')) {
      await DatabaseService.deletePost(post.id);
    }
  };

  const handleFlagPost = async () => {
    await DatabaseService.updatePostStatus(post.id, 'FLAGGED');
    alert('ভিডিওটি পর্যালোচনার জন্য ফ্ল্যাগ করা হয়েছে।');
  };

  const canModerate = isMainAdmin || isSideAdmin || currentUser?.id === post.userId;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-slate-700 backdrop-blur-sm">
      {/* Author Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-500/30"
            />
            {post.authorVerified && (
              <CheckCircle className="w-4 h-4 text-sky-400 bg-slate-950 rounded-full absolute -bottom-0.5 -right-0.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-sm text-slate-100">{post.authorName}</h4>
              {post.authorRole === 'MAIN_ADMIN' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> মেইন এডমিন
                </span>
              )}
              {post.authorRole === 'SIDE_ADMIN' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  সাইড এডমিন
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">@{post.authorUsername} • {new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Monetization Badge & Options */}
        <div className="flex items-center gap-2">
          {post.monetization?.enabled && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>৳{earnings.toFixed(2)} অর্জিত</span>
            </div>
          )}

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1 z-30">
                {canModerate && (
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ডিলিট করুন (Delete)
                  </button>
                )}
                <button
                  onClick={handleFlagPost}
                  className="w-full px-4 py-2 text-left text-xs text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5" /> রিপোর্ট / ফ্ল্যাগ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative bg-black group aspect-video sm:aspect-[16/10] overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src={post.mediaUrl}
          loop
          playsInline
          muted={isMuted}
          onTimeUpdate={() => {
            if (videoRef.current && videoRef.current.currentTime > 3) {
              triggerViewEarning();
            }
          }}
          onClick={handlePlayToggle}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* View Earning Floating Toast */}
        {showEarnToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-emerald-600/95 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce border border-emerald-400">
            <DollarSign className="w-4 h-4 text-emerald-200" />
            <span>+{earnedAmountToast.toFixed(3)} ৳ ভিউ ইনকাম ক্রিয়েটরের ওয়ালেটে জমা হয়েছে!</span>
          </div>
        )}

        {/* Big Play Overlay if paused */}
        {!isPlaying && (
          <div
            onClick={handlePlayToggle}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition"
          >
            <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition ring-4 ring-rose-500/30">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Video Controls Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayToggle}
              className="text-white hover:text-rose-400 transition"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-rose-400 transition"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>{viewsCount.toLocaleString()} ভিউ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-800">
              CPM: ৳{post.monetization?.cpm || 75}/1K
            </span>
            <button
              onClick={() => videoRef.current?.requestFullscreen()}
              className="text-slate-300 hover:text-white transition p-1"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details & Interactive Actions */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div>
          <h3 className="text-base font-bold text-slate-100 mb-1 leading-snug">{post.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{post.description}</p>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions Row */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isLiked
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={() => onOpenComments(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <MessageCircle className="w-4 h-4 text-sky-400" />
              <span>{post.commentsCount || 0}</span>
            </button>

            {/* Tip / Gift */}
            <button
              onClick={() => onOpenTipModal(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>টিপ দিন (Gift)</span>
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? 'কপি হয়েছে!' : 'শেয়ার'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
