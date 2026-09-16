import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Settings,
  Trash2,
  Lock,
  Unlock,
  Award,
  Clock,
  Sparkles,
  Eye,
  Radio,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { UserProfile, UserRole, Post, WithdrawalRequest, SystemSettings } from '../types';
import { MAIN_ADMIN_EMAIL } from '../lib/firebase';
import confetti from 'canvas-confetti';

export const AdminPanel: React.FC = () => {
  const { currentUser, isMainAdmin, users } = useAuth();

  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'USERS' | 'POSTS' | 'SETTINGS'>('PAYOUTS');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    defaultCpmRate: 75,
    minWithdrawalAmount: 200,
    platformFeePercent: 8,
    allowNewRegistrations: true,
    mainAdminEmail: MAIN_ADMIN_EMAIL,
  });

  const [txnInput, setTxnInput] = useState<Record<string, string>>({});
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubWdr = DatabaseService.subscribeWithdrawals(setWithdrawals);
    const unsubPosts = DatabaseService.subscribePosts(setPosts);
    const unsubSet = DatabaseService.subscribeSettings(setSettings);

    return () => {
      unsubWdr();
      unsubPosts();
      unsubSet();
    };
  }, []);

  const handleApprovePayout = async (req: WithdrawalRequest) => {
    const trx = txnInput[req.id] || `TXN-BK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const note = noteInput[req.id] || `Paid to ${req.paymentMethod} account ${req.accountNumber}`;

    await DatabaseService.processWithdrawal(req.id, 'APPROVED', note, trx);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
    alert(`উইথড্রয়াল অনুমোদিত হয়েছে! ট্রানজেকশন আইডি: ${trx}`);
  };

  const handleRejectPayout = async (req: WithdrawalRequest) => {
    const note = prompt('বাতিল করার কারণ লিখুন:', 'ভুল একাউন্ট নম্বর বা তথ্যের অমিল');
    if (note) {
      await DatabaseService.processWithdrawal(req.id, 'REJECTED', note);
      alert('রিকোয়েস্ট বাতিল করা হয়েছে এবং ক্রিয়েটরের ব্যালেন্সে টাকা ফেরত দেওয়া হয়েছে।');
    }
  };

  const handleToggleVerify = async (userId: string) => {
    const res = await DatabaseService.toggleUserVerification(userId);
    alert(res ? 'ক্রিয়েটরকে ব্লু ভেরিফাইড ব্যাজ দেওয়া হয়েছে!' : 'ভেরিফাইড ব্যাজ সরিয়ে নেওয়া হয়েছে।');
  };

  const handleRoleChange = async (user: UserProfile, newRole: UserRole) => {
    const isMasterAdmin = user.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
    
    if (isMasterAdmin && newRole !== 'MAIN_ADMIN' && currentUser?.email.toLowerCase() !== MAIN_ADMIN_EMAIL.toLowerCase()) {
      alert('প্রধান মাস্টার এডমিনের পদবী পরিবর্তন করা সম্ভব নয়!');
      return;
    }

    if (newRole === 'MAIN_ADMIN') {
      const confirmAssign = window.confirm(
        `আপনি কি নিশ্চিত যে "${user.name}" (${user.email})-কে সম্পূর্ণ মেইন এডমিন (Super Admin) ক্ষমতা দিতে চান?`
      );
      if (!confirmAssign) return;
    }

    await DatabaseService.updateUserRole(user.id, newRole);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });
    alert(`"${user.name}" এর ভূমিকা সফলভাবে পরিবর্তিত হয়েছে: ${newRole}`);
  };

  const handleToggleSideAdmin = async (user: UserProfile) => {
    const newRole: UserRole = user.role === 'SIDE_ADMIN' ? 'CREATOR' : 'SIDE_ADMIN';
    await handleRoleChange(user, newRole);
  };

  const handleToggleBan = async (userId: string) => {
    const res = await DatabaseService.toggleUserBan(userId);
    alert(res ? 'ব্যবহারকারীকে ব্যান (Ban) করা হয়েছে!' : 'ব্যবহারকারীকে আনব্যান (Unban) করা হয়েছে।');
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('অ্যাডমিন হিসেবে নিশ্চিত এই পোস্ট ডিলিট করতে চান?')) {
      await DatabaseService.deletePost(postId);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await DatabaseService.updateSettings(settings);
    alert('সিস্টেম সেটিংস সফলভাবে সেভ করা হয়েছে!');
  };

  // Calculations for Admin Analytics
  const totalUsersCount = users.length;
  const totalPostsCount = posts.length;
  const pendingPayouts = withdrawals.filter((w) => w.status === 'PENDING');
  const totalPaidOut = withdrawals
    .filter((w) => w.status === 'APPROVED')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                মেইন এডমিন কন্ট্রোল প্যানেল (Super Admin Panel)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                MASTER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              লগইন কৃত প্রধান অ্যাডমিন: <span className="text-amber-300 font-mono">{MAIN_ADMIN_EMAIL}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold">
            🛡️ ফুল সিস্টেম অ্যাক্সেস সক্রিয়
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">মোট রেজিস্টার্ড ইউজার</span>
          <span className="text-2xl font-black text-white">{totalUsersCount}</span>
        </div>
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">মোট পোস্ট (ভিডিও ও ফটো)</span>
          <span className="text-2xl font-black text-pink-400">{totalPostsCount}</span>
        </div>
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">পেন্ডিং পেআউট রিকোয়েস্ট</span>
          <span className="text-2xl font-black text-amber-400">{pendingPayouts.length} টি</span>
        </div>
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block mb-1">মোট পরিশোধিত ক্রিয়েটর পেআউট</span>
          <span className="text-2xl font-black text-emerald-400">৳{totalPaidOut.toLocaleString()}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PAYOUTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'PAYOUTS'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          উইথড্রয়াল ও পেআউট অনুমোদন ({pendingPayouts.length})
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'USERS'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          ব্যবহারকারী ও সাইড এডমিন ম্যানেজমেন্ট ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('POSTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'POSTS'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          কনটেন্ট মডারেশন ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'SETTINGS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          মনিটাইজেশন ও সিস্টেম সেটিংস
        </button>
      </div>

      {/* TAB 1: PAYOUTS MANAGER */}
      {activeTab === 'PAYOUTS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              ক্রিয়েটরদের টাকা উইথড্রয়াল রিকোয়েস্ট তালিকা
            </h3>
            <span className="text-xs text-slate-400">
              {pendingPayouts.length} টি পেন্ডিং অনুমোদন বাকি
            </span>
          </div>

          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                কোনো উইথড্রয়াল রিকোয়েস্ট নেই।
              </div>
            ) : (
              withdrawals.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition ${
                    req.status === 'PENDING'
                      ? 'bg-slate-950/80 border-amber-500/40 shadow-lg'
                      : req.status === 'APPROVED'
                      ? 'bg-slate-950/40 border-emerald-500/20 opacity-80'
                      : 'bg-slate-950/40 border-rose-500/20 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.userName}</span>
                        <span className="text-xs font-mono text-slate-400">({req.userEmail})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {req.paymentMethod}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        একাউন্ট: <strong className="text-amber-300">{req.accountNumber}</strong> | রিকোয়েস্ট তারিখ: {new Date(req.requestedAt).toLocaleString()}
                      </div>
                      {req.transactionId && (
                        <div className="text-[11px] font-mono text-emerald-400">
                          ট্রানজেকশন আইডি: {req.transactionId}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400">
                          ৳{req.amount.toLocaleString()}
                        </span>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {req.status}
                        </div>
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprovePayout(req)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                          >
                            <CheckCircle className="w-4 h-4" /> অনুমোদন ও পেমেন্ট
                          </button>
                          <button
                            onClick={() => handleRejectPayout(req)}
                            className="px-3 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                          >
                            <XCircle className="w-4 h-4" /> বাতিল
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === 'USERS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                ব্যবহারকারী ও এডমিন রোল ডেলিগেশন (Role & Permissions)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                মেইন এডমিন হিসেবে আপনি যেকোনো ইউজারের ভূমিকা পরিবর্তন করতে ও সাইড/মেইন এডমিন মর্যাদা দিতে পারেন।
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
              মোট {users.length} জন ইউজার
            </span>
          </div>

          {/* Role Policy Info Box */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-200/90">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>এডমিন নিয়মাবলী:</strong> প্ল্যাটফর্মে অন্য কেউ একাউন্ট বা এডমিন আইডি খুললে তারা <strong>সাইড এডমিন (SIDE ADMIN)</strong> অথবা ক্রিয়েটর হিসেবে যুক্ত হবে। আপনি প্রধান ইমেইল (<strong>{MAIN_ADMIN_EMAIL}</strong>) থেকে যখন খুশি যে কাউকে <strong>মেইন এডমিন</strong> বা <strong>সাইড এডমিন</strong> হিসেবে প্রমোশন দিতে পারেন।
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">ইউজার</th>
                  <th className="p-3.5">বর্তমান ভূমিকা (Role)</th>
                  <th className="p-3.5">রোল পরিবর্তন (Assign Role)</th>
                  <th className="p-3.5">ব্যালেন্স / ভিউ</th>
                  <th className="p-3.5">ভেরিফিকেশন</th>
                  <th className="p-3.5 rounded-r-xl text-right">মডারেশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isMaster = u.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-800"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1">
                              {u.name}
                              {u.isVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
                            </div>
                            <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {isMaster ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                            👑 MAIN ADMIN
                          </span>
                        ) : u.role === 'MAIN_ADMIN' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                            👑 CO-MAIN ADMIN
                          </span>
                        ) : u.role === 'SIDE_ADMIN' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
                            🛡️ SIDE ADMIN
                          </span>
                        ) : u.role === 'VIEWER' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                            VIEWER
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            CREATOR
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isMaster ? (
                          <span className="text-[11px] text-amber-400/80 italic font-mono">মাস্টার ওনার</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:border-amber-500 outline-none cursor-pointer"
                          >
                            <option value="CREATOR">🎬 ক্রিয়েটর (CREATOR)</option>
                            <option value="SIDE_ADMIN">🛡️ সাইড এডমিন (SIDE_ADMIN)</option>
                            <option value="MAIN_ADMIN">👑 মেইন এডমিন (MAIN_ADMIN)</option>
                            <option value="VIEWER">👁️ সাধারণ দর্শক (VIEWER)</option>
                          </select>
                        )}
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-emerald-400">৳{(u.wallet?.balance || 0).toLocaleString()}</div>
                        <div className="text-slate-500 text-[10px]">{(u.wallet?.totalViews || 0).toLocaleString()} ভিউ</div>
                      </td>

                      <td className="p-3.5">
                        <button
                          disabled={isMaster}
                          onClick={() => handleToggleVerify(u.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
                            u.isVerified
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {u.isVerified ? 'ভেরিফাইড ✔' : '+ ভেরিফাই করুন'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {!isMaster && (
                          <button
                            onClick={() => handleToggleBan(u.id)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                              u.isBanned
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {u.isBanned ? 'আনব্যান করুন' : 'ব্যান করুন'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: POSTS MODERATION */}
      {activeTab === 'POSTS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-400" />
              সকল পোস্ট ও ভিডিও মডারেশন
            </h3>
            <span className="text-xs text-slate-400">মোট {posts.length} টি কনটেন্ট</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      {post.type}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">{post.title}</h4>
                    <p className="text-[11px] text-slate-400">@{post.authorUsername} • ৳{post.monetization?.earnings || 0}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition"
                  title="ডিলিট করুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              গ্লোবাল মনিটাইজেশন ও সিস্টেম কনফিগারেশন
            </h3>
            <p className="text-xs text-slate-400">
              প্ল্যাটফর্মের ভিউ আর্নিং রেট, মিনিমাম উইথড্র এবং রুলস কনফিগার করুন
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                ডিফল্ট CPM রেট (প্রতি ১,০০০ ভিউ এর জন্য ক্রিয়েটর পাবে - ৳)
              </label>
              <input
                type="number"
                value={settings.defaultCpmRate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultCpmRate: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                নূন্যতম উইথড্রয়াল লিমিট (Min Withdrawal in BDT ৳)
              </label>
              <input
                type="number"
                value={settings.minWithdrawalAmount}
                onChange={(e) =>
                  setSettings({ ...settings, minWithdrawalAmount: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                মেইন এডমিন ইমেইল (Master Admin)
              </label>
              <input
                type="email"
                disabled
                value={settings.mainAdminEmail}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono outline-none cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-600/30"
            >
              সেটিংস আপডেট করুন (Save Settings)
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
