import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Eye,
  CheckCircle,
  ShieldCheck,
  MoreVertical,
  Trash2,
  Flag,
  Sparkles,
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Download,
} from 'lucide-react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import confetti from 'canvas-confetti';

interface PhotoSessionCardProps {
  post: Post;
  onOpenComments: (post: Post) => void;
  onOpenTipModal: (post: Post) => void;
}

export const PhotoSessionCard: React.FC<PhotoSessionCardProps> = ({
  post,
  onOpenComments,
  onOpenTipModal,
}) => {
  const { currentUser, isMainAdmin, isSideAdmin } = useAuth();
  
  const allImages = [post.mediaUrl, ...(post.additionalMediaUrls || [])];
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(
    currentUser ? post.likedBy?.includes(currentUser.id) : false
  );
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const [earnings, setEarnings] = useState(post.monetization?.earnings || 0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasEarnedView, setHasEarnedView] = useState(false);

  useEffect(() => {
    setLikesCount(post.likesCount);
    setIsLiked(currentUser ? post.likedBy?.includes(currentUser.id) : false);
    setViewsCount(post.viewsCount);
    setEarnings(post.monetization?.earnings || 0);
  }, [post, currentUser]);

  const handleImageClick = async (index: number) => {
    setCurrentImgIndex(index);
    setShowLightbox(true);

    if (!hasEarnedView) {
      setHasEarnedView(true);
      const res = await DatabaseService.recordViewAndEarn(post.id, post.userId, post.monetization?.cpm);
      setViewsCount((prev) => prev + 1);
      setEarnings((prev) => Math.round((prev + res.earned) * 100) / 100);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    await DatabaseService.likePost(post.id, currentUser.id);

    if (newLiked) {
      confetti({
        particleCount: 35,
        spread: 70,
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
    if (window.confirm('আপনি কি নিশ্চিত এই ফটো সেশনটি ডিলিট করতে চান?')) {
      await DatabaseService.deletePost(post.id);
    }
  };

  const handleFlagPost = async () => {
    await DatabaseService.updatePostStatus(post.id, 'FLAGGED');
    alert('ফটো সেশনটি পর্যালোচনার জন্য ফ্ল্যাগ করা হয়েছে।');
  };

  const canModerate = isMainAdmin || isSideAdmin || currentUser?.id === post.userId;

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-slate-700 backdrop-blur-sm">
        {/* Author Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-500/30"
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

          {/* Theme badge & Monetization */}
          <div className="flex items-center gap-2">
            {post.photoTheme && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2.5 py-0.5 rounded-lg">
                <Camera className="w-3 h-3" />
                {post.photoTheme}
              </span>
            )}
            {post.monetization?.enabled && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>৳{earnings.toFixed(2)}</span>
              </div>
            )}

            {/* Menu */}
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
                      <Trash2 className="w-3.5 h-3.5" /> ডিলিট করুন
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

        {/* Primary Photo Showcase & Carousel */}
        <div className="relative bg-slate-950 group">
          <div
            onClick={() => handleImageClick(currentImgIndex)}
            className="aspect-[4/3] sm:aspect-[16/10] overflow-hidden cursor-pointer flex items-center justify-center bg-black/40"
          >
            <img
              src={allImages[currentImgIndex]}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Photo Counter Pill */}
          {allImages.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-white/10">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>{currentImgIndex + 1} / {allImages.length} ছবি</span>
            </div>
          )}

          {/* Left / Right Nav on multi-photos */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm border border-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Expand Button */}
          <button
            onClick={() => handleImageClick(currentImgIndex)}
            className="absolute bottom-3 right-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition backdrop-blur-md border border-white/10"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Preview Strip for Multi-Photos */}
        {allImages.length > 1 && (
          <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImgIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                  currentImgIndex === idx
                    ? 'ring-2 ring-pink-500 scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content Details */}
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
                  className="text-[11px] font-medium text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-lg border border-pink-500/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isLiked
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-pink-500' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <button
                onClick={() => onOpenComments(post)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <MessageCircle className="w-4 h-4 text-sky-400" />
                <span>{post.commentsCount || 0}</span>
              </button>

              <button
                onClick={() => onOpenTipModal(post)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                <span>টিপ দিন (Gift)</span>
              </button>

              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 pl-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{viewsCount.toLocaleString()} ভিউ</span>
              </div>
            </div>

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

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center">
            <img
              src={allImages[currentImgIndex]}
              alt={post.title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
                  }
                  className="absolute -left-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImgIndex((prev) =>
                      prev < allImages.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute -right-12 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 text-white text-sm">
            <span>
              {currentImgIndex + 1} / {allImages.length}
            </span>
            <a
              href={allImages[currentImgIndex]}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
            >
              <Download className="w-4 h-4" /> ডাউনলোড করুন (Download HD)
            </a>
          </div>
        </div>
      )}
    </>
  );
};
