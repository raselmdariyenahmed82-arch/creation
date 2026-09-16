import React, { useState, useRef } from 'react';
import {
  X,
  Video,
  Camera,
  Upload,
  Sparkles,
  DollarSign,
  Plus,
  Trash2,
  Play,
  Square,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { Post, PostType } from '../types';
import confetti from 'canvas-confetti';

interface CreateModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const SAMPLE_VIDEOS = [
  { name: 'Cinematic Nature Blazes', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { name: 'Urban Drone & Joy', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4' },
  { name: 'Model Lifestyle Reels', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
];

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1000&auto=format&fit=crop&q=80',
];

export const CreateModal: React.FC<CreateModalProps> = ({ onClose, onPostCreated }) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'VIDEO' | 'PHOTO'>('VIDEO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('creator, monetization, viral');
  const [monetizationEnabled, setMonetizationEnabled] = useState(true);
  const [cpmRate, setCpmRate] = useState(75); // BDT per 1000 views

  // Video State
  const [videoSourceType, setVideoSourceType] = useState<'UPLOAD' | 'URL' | 'SAMPLE'>('SAMPLE');
  const [videoUrl, setVideoUrl] = useState(SAMPLE_VIDEOS[0].url);
  const [isRecording, setIsRecording] = useState(false);
  const recordVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Photo Session State
  const [photoTheme, setPhotoTheme] = useState('Glamour Portrait Session');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([
    SAMPLE_PHOTO_PRESETS[0],
    SAMPLE_PHOTO_PRESETS[1],
  ]);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [filterStyle, setFilterStyle] = useState<'NORMAL' | 'WARM' | 'VIVID' | 'NOIR'>('NORMAL');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Video File Upload
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setVideoSourceType('UPLOAD');
    }
  };

  // Handle Photo File Upload
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        newUrls.push(URL.createObjectURL(files[i]));
      }
      setSelectedPhotos((prev) => [...prev, ...newUrls]);
    }
  };

  const handleAddPhotoUrl = () => {
    if (customPhotoInput.trim()) {
      setSelectedPhotos((prev) => [...prev, customPhotoInput.trim()]);
      setCustomPhotoInput('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) {
      alert('অনুগ্রহ করে একটি টাইটেল লিখুন!');
      return;
    }

    setIsSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/#/g, ''))
      .filter(Boolean);

    const newPostId = `post_${Date.now()}`;

    if (activeTab === 'VIDEO') {
      const newPost: Post = {
        id: newPostId,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatarUrl,
        authorRole: currentUser.role,
        authorVerified: currentUser.isVerified,
        type: 'VIDEO',
        title: title.trim(),
        description: description.trim(),
        tags: tags.length ? tags : ['video', 'creator'],
        mediaUrl: videoUrl,
        aspectRatio: 'landscape',
        duration: 15,
        viewsCount: 1,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        monetization: {
          enabled: monetizationEnabled,
          earnings: 0,
          cpm: cpmRate,
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.createPost(newPost);
    } else {
      // Photo Session
      const primaryPhoto = selectedPhotos[0] || SAMPLE_PHOTO_PRESETS[0];
      const additionalPhotos = selectedPhotos.slice(1);

      const newPost: Post = {
        id: newPostId,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatarUrl,
        authorRole: currentUser.role,
        authorVerified: currentUser.isVerified,
        type: additionalPhotos.length > 0 ? 'PHOTOSET' : 'PHOTO',
        title: title.trim(),
        description: description.trim(),
        tags: tags.length ? tags : ['photosession', 'photography'],
        mediaUrl: primaryPhoto,
        additionalMediaUrls: additionalPhotos,
        photoTheme: photoTheme,
        aspectRatio: 'portrait',
        viewsCount: 1,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        monetization: {
          enabled: monetizationEnabled,
          earnings: 0,
          cpm: cpmRate,
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.createPost(newPost);
    }

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    setIsSubmitting(false);
    onPostCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl my-auto overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">ক্রিয়েটর কনটেন্ট স্টুডিও (Create Studio)</h2>
              <p className="text-xs text-slate-400">নতুন ভিডিও বা ফটো সেশন পোস্ট করে ভিউ থেকে ইনকাম শুরু করুন</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Type Selector Tabs */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('VIDEO')}
            className={`py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'VIDEO'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            ভিডিও কনটেন্ট (Video)
          </button>

          <button
            onClick={() => setActiveTab('PHOTO')}
            className={`py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              activeTab === 'PHOTO'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            ফটো সেশন (Photo Session)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              কনটেন্ট টাইটেল (Title) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === 'VIDEO'
                  ? 'যেমন: নতুন সিনেমাটিক ভিডিও ক্লিপ ও টিউটোরিয়াল...'
                  : 'যেমন: গোধূলির আলোয় ফটোসেশন অ্যালবাম...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 focus:border-rose-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              বিবরণ (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="আপনার কনটেন্ট সম্পর্কে বিস্তারিত লিখুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-rose-500 outline-none resize-none"
            />
          </div>

          {/* VIDEO SPECIFIC INPUTS */}
          {activeTab === 'VIDEO' ? (
            <div className="space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-rose-400 block">ভিডিও সোর্স নির্বাচন করুন (Select Video Source):</span>
              
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-xl cursor-pointer text-xs font-medium text-slate-200 transition">
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>ডিভাইস থেকে ভিডিও আপলোড</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400">অথবা স্যাম্পল ভিডিও বেছে নিন:</span>
                  <select
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setVideoSourceType('SAMPLE');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 focus:border-rose-500 outline-none"
                  >
                    {SAMPLE_VIDEOS.map((v) => (
                      <option key={v.url} value={v.url}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video Preview */}
              {videoUrl && (
                <div className="mt-2 rounded-xl overflow-hidden aspect-video bg-black max-h-48 flex items-center justify-center">
                  <video src={videoUrl} controls className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          ) : (
            /* PHOTO SESSION SPECIFIC INPUTS */
            <div className="space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400">ফটো সেশন গ্যালারি (Photoset Gallery):</span>
                <span className="text-[11px] text-slate-400">{selectedPhotos.length} টি ছবি যুক্ত আছে</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ফটো সেশন থিম (Theme / Style):
                </label>
                <input
                  type="text"
                  value={photoTheme}
                  onChange={(e) => setPhotoTheme(e.target.value)}
                  placeholder="যেমন: Sunset Glamour, Urban Aesthetic, Studio Neon"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-pink-500"
                />
              </div>

              {/* Upload photo button */}
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-slate-900 border border-slate-800 hover:border-pink-500/50 rounded-xl cursor-pointer text-xs font-semibold text-slate-200 transition">
                  <Upload className="w-4 h-4 text-pink-400" />
                  <span>ছবি আপলোড করুন (Multiple Photos)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Add direct URL */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  placeholder="বা ছবির ইমেজ URL পেস্ট করুন..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Photos Preview Grid */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {selectedPhotos.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-800">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              ট্যাগসমূহ (Tags - কমা দিয়ে আলাদা করুন)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="vlog, photoshoot, lifestyle, tech"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-rose-500 outline-none"
            />
          </div>

          {/* Monetization Settings Card */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-200">ভিউ মনিটাইজেশন ও ইনকাম (Monetization)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={monetizationEnabled}
                  onChange={(e) => setMonetizationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {monetizationEnabled && (
              <div className="pt-2 border-t border-emerald-900/50 flex items-center justify-between text-xs">
                <span className="text-slate-300">প্রতি ১,০০০ ভিউ রেট (CPM Rate):</span>
                <span className="font-bold text-emerald-400 bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-700">
                  ৳{cpmRate} / 1K ভিউ
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-600/30 transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? 'পোস্ট আপলোড হচ্ছে...' : 'প্রকাশ করুন (Publish Post) 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};
