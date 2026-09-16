import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Plus,
  Play,
  Heart,
  Share2,
} from 'lucide-react';
import { Post, LiveStream, UserProfile } from '../types';
import { DatabaseService } from '../services/dbService';
import { SearchBar } from './SearchBar';
import { VideoCard } from './VideoCard';
import { PhotoSessionCard } from './PhotoSessionCard';
import { useAuth } from '../context/AuthContext';

interface FeedProps {
  onOpenComments: (post: Post) => void;
  onOpenTipModal: (post: Post) => void;
  onOpenLiveRoom: (stream: LiveStream) => void;
  onOpenLiveStudio: () => void;
  onOpenCreateModal: () => void;
}

export const Feed: React.FC<FeedProps> = ({
  onOpenComments,
  onOpenTipModal,
  onOpenLiveRoom,
  onOpenLiveStudio,
  onOpenCreateModal,
}) => {
  const { currentUser, users } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VIDEOS' | 'PHOTOS' | 'LIVE' | 'EARNINGS'>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const unsubPosts = DatabaseService.subscribePosts((list) => {
      setPosts(list);
    });
    const unsubLive = DatabaseService.subscribeLiveStreams((list) => {
      setLiveStreams(list);
    });

    return () => {
      unsubPosts();
      unsubLive();
    };
  }, []);

  // Filter and Search Logic
  const filteredPosts = posts.filter((post) => {
    // 1. Text Search matching title, description, tags, or author
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchDesc = post.description.toLowerCase().includes(q);
      const matchAuthor = post.authorName.toLowerCase().includes(q) || post.authorUsername.toLowerCase().includes(q);
      const matchTags = post.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchAuthor && !matchTags) {
        return false;
      }
    }

    // 2. Tag Filter
    if (selectedTag) {
      const hasTag = post.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      if (!hasTag) return false;
    }

    // 3. Type / Category Filter
    if (activeFilter === 'VIDEOS') {
      return post.type === 'VIDEO';
    }
    if (activeFilter === 'PHOTOS') {
      return post.type === 'PHOTO' || post.type === 'PHOTOSET';
    }
    if (activeFilter === 'EARNINGS') {
      return (post.monetization?.earnings || 0) > 0;
    }

    return true;
  });

  // Active Live streams
  const activeLiveStreams = liveStreams.filter((s) => s.status === 'LIVE');

  // Top Creators Leaderboard sorted by earnings
  const topCreators = [...users].sort(
    (a, b) => (b.wallet?.totalEarned || 0) - (a.wallet?.totalEarned || 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Search and Category Filter Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
      />

      {/* ACTIVE LIVE BROADCASTS CAROUSEL */}
      {activeLiveStreams.length > 0 && activeFilter !== 'VIDEOS' && activeFilter !== 'PHOTOS' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                লাইভ স্ট্রিমিং চলছে (Live Streams)
              </h2>
            </div>
            <button
              onClick={onOpenLiveStudio}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              + নিজে লাইভে যান
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLiveStreams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => onOpenLiveRoom(stream)}
                className="group relative bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-3xl overflow-hidden cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="aspect-video relative overflow-hidden bg-black">
                  <img
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md shadow-lg animate-pulse uppercase">
                    <Radio className="w-3 h-3" /> LIVE
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/10">
                    <Users className="w-3 h-3 text-sky-400" />
                    <span>{stream.viewerCount.toLocaleString()}</span>
                  </div>

                  {/* Stream Host Details on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5">
                    <img
                      src={stream.hostAvatar}
                      alt={stream.hostName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500"
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white leading-tight truncate">
                        {stream.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 flex items-center gap-1">
                        {stream.hostName}
                        {stream.hostVerified && <CheckCircle className="w-3 h-3 text-sky-400" />}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MAIN TWO-COLUMN LAYOUT: Content Feed + Top Creators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Video & Photo Feed */}
        <div className="lg:col-span-2 space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">কোনো কনটেন্ট পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                অন্য কোনো ফিল্টার নির্বাচন করুন অথবা সরাসরি নতুন ভিডিও বা ফটোসেশন পোস্ট করুন।
              </p>
              <button
                onClick={onOpenCreateModal}
                className="mt-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
              >
                + নতুন পোস্ট করুন
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              if (post.type === 'VIDEO') {
                return (
                  <VideoCard
                    key={post.id}
                    post={post}
                    onOpenComments={onOpenComments}
                    onOpenTipModal={onOpenTipModal}
                  />
                );
              } else {
                return (
                  <PhotoSessionCard
                    key={post.id}
                    post={post}
                    onOpenComments={onOpenComments}
                    onOpenTipModal={onOpenTipModal}
                  />
                );
              }
            })
          )}
        </div>

        {/* Right 1 Col: Top Creators & Income Leaderboard */}
        <div className="space-y-6">
          {/* Top Creators Leaderboard Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">টপ আর্নিং ক্রিয়েটরস (Leaderboard)</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                লাইভ ইনকাম
              </span>
            </div>

            <div className="space-y-3">
              {topCreators.slice(0, 4).map((creator, idx) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-2xl transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <img
                      src={creator.avatarUrl}
                      alt={creator.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1 line-clamp-1">
                        {creator.name}
                        {creator.isVerified && <CheckCircle className="w-3 h-3 text-sky-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {(creator.stats?.totalViews || 0).toLocaleString()} মোট ভিউ
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-400 block font-mono">
                      ৳{(creator.wallet?.totalEarned || 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">অর্জিত আয়</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Platform Guidelines & How it Works */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              ভিউ থেকে কীভাবে আয় করবেন?
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">১.</span>
                <span>এইচডি কোয়ালিটি ভিডিও বা ফটো সেশন অ্যালবাম আপলোড করুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">২.</span>
                <span>প্রতি ১,০০০ ভিউ এর জন্য নির্ধারিত CPM রেটে টাকা সরাসরি জমা হবে।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">৩.</span>
                <span>লাইভ স্ট্রিম চলাকালীন দর্শকদের থেকে সরাসরি স্পেশাল গিফট ও টিপ অর্জন করুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">৪.</span>
                <span>বিকাশ, নগদ বা রকেটে ন্যূনতম ২০০ ৳ হলেই উইথড্র রিকোয়েস্ট পাঠান।</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
