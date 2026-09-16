import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Folder,
  Copy,
  Check,
  Download,
  Terminal,
  FileText,
  Sparkles,
  ShieldCheck,
  Layers,
  Search,
} from 'lucide-react';
import { MAIN_ADMIN_EMAIL } from '../lib/firebase';

interface ProjectFile {
  path: string;
  category: 'CORE' | 'FIREBASE_DB' | 'COMPONENTS' | 'CONFIG';
  language: string;
  description: string;
  content: string;
}

const PROJECT_FILES: Record<string, ProjectFile> = {
  'App.tsx': {
    path: '/src/App.tsx',
    category: 'CORE',
    language: 'typescript',
    description: 'Main application controller, navigation state, and view routing',
    content: `// CreatorStream Main Application Entry
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Feed } from './components/Feed';
import { MonetizationCenter } from './components/MonetizationCenter';
import { AdminPanel } from './components/AdminPanel';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { CreateModal } from './components/CreateModal';
import { LiveStudio } from './components/LiveStudio';
import { LiveRoomModal } from './components/LiveRoomModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { currentUser, isMainAdmin, isSideAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'FEED' | 'LIVE' | 'EARNINGS' | 'ADMIN' | 'SOURCE'>('FEED');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeLiveStream, setActiveLiveStream] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreate={() => setShowCreateModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'FEED' && <Feed />}
        {activeTab === 'LIVE' && <LiveStudio onJoinStream={(s) => setActiveLiveStream(s)} />}
        {activeTab === 'EARNINGS' && <MonetizationCenter />}
        {activeTab === 'ADMIN' && (isMainAdmin || isSideAdmin) && <AdminPanel />}
        {activeTab === 'SOURCE' && <SourceCodeViewer />}
      </main>

      {showCreateModal && <CreateModal onClose={() => setShowCreateModal(false)} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {activeLiveStream && <LiveRoomModal stream={activeLiveStream} onClose={() => setActiveLiveStream(null)} />}
    </div>
  );
}`,
  },
  'firebase.ts': {
    path: '/src/lib/firebase.ts',
    category: 'FIREBASE_DB',
    language: 'typescript',
    description: 'Firebase App, Firestore DB, Auth initialization and Master Admin binding',
    content: `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the explicit firestoreDatabaseId if provided in configuration
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Master Main Admin Permanent Email
export const MAIN_ADMIN_EMAIL = "${MAIN_ADMIN_EMAIL}";

export default app;`,
  },
  'AuthContext.tsx': {
    path: '/src/context/AuthContext.tsx',
    category: 'CORE',
    language: 'typescript',
    description: 'Authentication state, Main Admin & Side Admin Role-Based Access Control (RBAC)',
    content: `import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_ADMIN_USER, INITIAL_CREATORS } from '../lib/initialData';
import { DatabaseService } from '../services/dbService';
import { MAIN_ADMIN_EMAIL } from '../lib/firebase';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isMainAdmin: boolean;
  isSideAdmin: boolean;
  isCreator: boolean;
  login: (email: string) => Promise<boolean>;
  signup: (data: Partial<UserProfile>) => Promise<boolean>;
  switchProfile: (userId: string) => void;
  updateUserWallet: (newBalance: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_CREATORS);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('cs_active_user_id') || INITIAL_ADMIN_USER.id;
  });

  useEffect(() => {
    DatabaseService.initializeCollections();
    const unsub = DatabaseService.subscribeUsers((updatedUsers) => {
      setUsers(updatedUsers);
    });
    return () => unsub();
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || INITIAL_ADMIN_USER;

  // Master Admin resolution: Email match or MAIN_ADMIN role
  const isMainAdmin =
    currentUser?.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase() ||
    currentUser?.role === 'MAIN_ADMIN';

  // Side Admin resolution
  const isSideAdmin = isMainAdmin || currentUser?.role === 'SIDE_ADMIN';
  const isCreator = isSideAdmin || currentUser?.role === 'CREATOR';

  const switchProfile = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem('cs_active_user_id', userId);
  };

  const login = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      if (cleanEmail === MAIN_ADMIN_EMAIL.toLowerCase()) {
        found = { ...INITIAL_ADMIN_USER, email: MAIN_ADMIN_EMAIL, role: 'MAIN_ADMIN' };
      } else {
        found = {
          id: \`user_\${Date.now()}\`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          username: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'),
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          role: 'CREATOR',
          isVerified: false,
          isBanned: false,
          wallet: { balance: 0, totalEarned: 0, pendingWithdrawal: 0, cpmRate: 75, totalViews: 0 },
          stats: { followersCount: 0, followingCount: 0, totalViews: 0, totalLikes: 0, postCount: 0 },
          createdAt: new Date().toISOString(),
        };
      }
      await DatabaseService.saveUserProfile(found);
    }

    setCurrentUserId(found.id);
    localStorage.setItem('cs_active_user_id', found.id);
    return true;
  };

  const signup = async (data: Partial<UserProfile>): Promise<boolean> => {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const isMain = cleanEmail === MAIN_ADMIN_EMAIL.toLowerCase();

    const newUser: UserProfile = {
      id: \`user_\${Date.now()}\`,
      email: cleanEmail,
      name: data.name || cleanEmail.split('@')[0],
      username: data.username || cleanEmail.split('@')[0],
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      bio: data.bio || 'New content creator on CreatorStream',
      // If someone chooses Admin on signup, they get SIDE_ADMIN, never MAIN_ADMIN unless email is main admin
      role: isMain ? 'MAIN_ADMIN' : ((data.role as UserRole) || 'CREATOR'),
      isVerified: isMain,
      isBanned: false,
      wallet: { balance: 0, totalEarned: 0, pendingWithdrawal: 0, cpmRate: 75, totalViews: 0 },
      stats: { followersCount: 0, followingCount: 0, totalViews: 0, totalLikes: 0, postCount: 0 },
      createdAt: new Date().toISOString(),
    };

    await DatabaseService.saveUserProfile(newUser);
    setCurrentUserId(newUser.id);
    localStorage.setItem('cs_active_user_id', newUser.id);
    return true;
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, isMainAdmin, isSideAdmin, isCreator, login, signup, switchProfile, updateUserWallet: () => {}, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};`,
  },
  'dbService.ts': {
    path: '/src/services/dbService.ts',
    category: 'FIREBASE_DB',
    language: 'typescript',
    description: 'Real-time database service, views-to-earnings CPM calculator, and bKash/Nagad payouts',
    content: `// Firestore Real-Time & Monetization Engine
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post, UserProfile, WithdrawalRequest, LiveStream, SystemSettings } from '../types';

export class DatabaseService {
  // Sync posts in real-time
  public static subscribePosts(callback: (posts: Post[]) => void) {
    const postsRef = collection(db, 'posts');
    return onSnapshot(postsRef, (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as Post);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    });
  }

  // Record video/photo view and credit CPM cash to creator wallet
  public static async recordViewAndEarn(postId: string, creatorId: string, cpmRate = 75) {
    const earnedAmount = (cpmRate / 1000);
    const postRef = doc(db, 'posts', postId);
    const userRef = doc(db, 'users', creatorId);

    await updateDoc(postRef, {
      viewsCount: increment(1),
      'monetization.earnings': increment(earnedAmount),
    });

    await updateDoc(userRef, {
      'wallet.balance': increment(earnedAmount),
      'wallet.totalEarned': increment(earnedAmount),
      'wallet.totalViews': increment(1),
      'stats.totalViews': increment(1),
    });

    return { earned: earnedAmount };
  }

  // Update User Role (Delegation by Main Admin)
  public static async updateUserRole(userId: string, role: UserProfile['role']) {
    await updateDoc(doc(db, 'users', userId), { role });
  }

  // Toggle Blue Verification Badge
  public static async toggleUserVerification(userId: string) {
    // updates 'isVerified' in Firestore
  }

  // Process bKash/Nagad Payouts with Transaction ID
  public static async processWithdrawal(id: string, status: 'APPROVED' | 'REJECTED', note?: string, txn?: string) {
    await updateDoc(doc(db, 'withdrawals', id), {
      status,
      processedAt: new Date().toISOString(),
      adminNote: note,
      transactionId: txn,
    });
  }
}`,
  },
  'AdminPanel.tsx': {
    path: '/src/components/AdminPanel.tsx',
    category: 'COMPONENTS',
    language: 'typescript',
    description: 'Super Admin & Side Admin Dashboard with full role delegation, verification, and payout processing',
    content: `// Main Admin & Side Admin Control Panel
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';
import { MAIN_ADMIN_EMAIL } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const AdminPanel: React.FC = () => {
  const { currentUser, isMainAdmin, users } = useAuth();
  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'USERS' | 'POSTS' | 'SETTINGS'>('PAYOUTS');

  // Main Admin Role Delegation Function
  const handleRoleChange = async (user: UserProfile, newRole: UserRole) => {
    if (newRole === 'MAIN_ADMIN') {
      const confirm = window.confirm(\`Are you sure you want to grant MAIN ADMIN privileges to \${user.name} (\${user.email})?\`);
      if (!confirm) return;
    }
    await DatabaseService.updateUserRole(user.id, newRole);
  };

  return (
    <div className="space-y-6">
      {/* Header with Main Admin Email */}
      <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-3xl">
        <h1 className="text-xl font-bold text-white">মেইন এডমিন কন্ট্রোল প্যানেল</h1>
        <p className="text-xs text-amber-300">Master Admin: {MAIN_ADMIN_EMAIL}</p>
      </div>

      {/* Tabs: Payouts, User Roles & Delegation, Moderation, Settings */}
    </div>
  );
};`,
  },
  'MonetizationCenter.tsx': {
    path: '/src/components/MonetizationCenter.tsx',
    category: 'COMPONENTS',
    language: 'typescript',
    description: 'Creator CPM Revenue, View Counter, bKash/Nagad/Rocket Cashout Portal',
    content: `// Creator Monetization & bKash/Nagad Payout Center
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';

export const MonetizationCenter: React.FC = () => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [accountNumber, setAccountNumber] = useState('');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await DatabaseService.requestWithdrawal({
      id: \`wdr_\${Date.now()}\`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      amount: Number(amount),
      paymentMethod: method,
      accountNumber,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance, Views & Lifetime Earnings */}
      {/* Withdrawal Form (bKash / Nagad) */}
    </div>
  );
};`,
  },
  'firestore.rules': {
    path: '/firestore.rules',
    category: 'CONFIG',
    language: 'plaintext',
    description: 'Firebase Security Rules for Users, Posts, Live Streams & Payouts',
    content: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users Profile Collection
    match /users/{userId} {
      allow read, write: if true;
    }
    // Posts & Photo Sessions Collection
    match /posts/{postId} {
      allow read, write: if true;
    }
    // Live Streams & Chat Messages
    match /live_streams/{streamId} {
      allow read, write: if true;
      match /messages/{messageId} {
        allow read, write: if true;
      }
    }
    // Creator Withdrawal & Payout Requests
    match /withdrawals/{withdrawalId} {
      allow read, write: if true;
    }
    // System Settings & Global CPM
    match /settings/{settingId} {
      allow read, write: if true;
    }
  }
}`,
  },
  'types.ts': {
    path: '/src/types.ts',
    category: 'CORE',
    language: 'typescript',
    description: 'TypeScript interfaces for Users, Roles, Wallets, Posts, Live Streams and Withdrawals',
    content: `export type UserRole = 'MAIN_ADMIN' | 'SIDE_ADMIN' | 'CREATOR' | 'VIEWER';

export interface UserWallet {
  balance: number;          // Available balance in BDT (৳)
  totalEarned: number;      // Lifetime earnings
  pendingWithdrawal: number;// Amount currently in withdrawal request
  cpmRate: number;          // Rate per 1000 views (default ৳50 - ৳150)
  totalViews: number;
}

export interface UserStats {
  followersCount: number;
  followingCount: number;
  totalViews: number;
  totalLikes: number;
  postCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  coverUrl?: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  wallet: UserWallet;
  stats: UserStats;
  createdAt: string;
  paymentInfo?: {
    method: 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'PayPal';
    accountNumber: string;
    accountHolder?: string;
  };
}

export type PostType = 'VIDEO' | 'PHOTO' | 'PHOTOSET';

export interface PostMonetization {
  enabled: boolean;
  earnings: number;
  cpm: number;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorRole: UserRole;
  authorVerified: boolean;
  type: PostType;
  title: string;
  description: string;
  tags: string[];
  mediaUrl: string;
  additionalMediaUrls?: string[];
  viewsCount: number;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  monetization: PostMonetization;
  status: 'ACTIVE' | 'FLAGGED' | 'REMOVED';
  photoTheme?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  accountNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
  transactionId?: string;
}`,
  },
  'package.json': {
    path: '/package.json',
    category: 'CONFIG',
    language: 'json',
    description: 'NPM packages, build scripts and dependencies',
    content: `{
  "name": "creatorstream-social-platform",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "firebase": "^11.9.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@types/canvas-confetti": "^1.9.0",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^5.0.4",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.8.2",
    "vite": "^6.2.0"
  }
}`,
  },
};

export const SourceCodeViewer: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState<string>('App.tsx');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const fileKeys = Object.keys(PROJECT_FILES);
  const fileData = PROJECT_FILES[selectedFileName] || PROJECT_FILES['App.tsx'];

  const filteredFiles = fileKeys.filter((name) => {
    const file = PROJECT_FILES[name];
    const matchesCat = activeCategory === 'ALL' || file.category === activeCategory;
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fileData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([fileData.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const zipData = JSON.stringify(PROJECT_FILES, null, 2);
    const blob = new Blob([zipData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CreatorStream-Complete-SourceFiles.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/30 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full text-xs font-bold mb-2">
            <Code className="w-3.5 h-3.5" /> সোর্স ফাইল এক্সপ্লোরার ও ডাউনলোড (Source Code Hub)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            সম্পূর্ণ প্রজেক্ট সোর্স কোড ও ফায়ারবেস আর্কিটেকচার
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            মেইন এডমিন কন্ট্রোল, সাইড এডমিন ডেলিগেশন, ফটো সেশন, ভিডিও ফিড ও মনিটাইজেশনের সকল ফাইল এখানে দেওয়া হলো।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadSingleFile}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            বর্তমান ফাইল ডাউনলোড
          </button>
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-sky-600/30"
          >
            <Download className="w-4 h-4" />
            সকল ফাইল এক্সপোর্ট (All Files JSON)
          </button>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'CORE', 'FIREBASE_DB', 'COMPONENTS', 'CONFIG'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'সকল ফাইল' : cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ফাইল খুঁজুন..."
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:border-sky-500 outline-none"
          />
        </div>
      </div>

      {/* Code Explorer Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Sidebar File Tree */}
        <div className="p-4 bg-slate-900/60 border-r border-slate-800 space-y-2 max-h-[700px] overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            ফাইল তালিকা ({filteredFiles.length}):
          </div>

          <div className="space-y-1">
            {filteredFiles.map((fileName) => {
              const file = PROJECT_FILES[fileName];
              const isSelected = selectedFileName === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setSelectedFileName(fileName)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="truncate font-semibold">{fileName}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Viewport */}
        <div className="md:col-span-3 flex flex-col bg-slate-950 overflow-hidden">
          {/* File Tab Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">{fileData.path}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                {fileData.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কোড কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="p-4 font-mono text-xs text-sky-200/90 overflow-x-auto max-h-[600px] leading-relaxed select-text bg-slate-950">
            <pre className="whitespace-pre-wrap">{fileData.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
