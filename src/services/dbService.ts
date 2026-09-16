import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Post,
  UserProfile,
  LiveStream,
  WithdrawalRequest,
  SystemSettings,
  Comment,
  LiveChatMessage,
} from '../types';
import {
  INITIAL_POSTS,
  INITIAL_CREATORS,
  INITIAL_LIVE_STREAMS,
  INITIAL_WITHDRAWALS,
  INITIAL_SETTINGS,
} from '../lib/initialData';

const STORAGE_KEYS = {
  POSTS: 'cs_posts_cache_v1',
  USERS: 'cs_users_cache_v1',
  LIVE: 'cs_live_cache_v1',
  WITHDRAWALS: 'cs_withdrawals_cache_v1',
  SETTINGS: 'cs_settings_cache_v1',
  COMMENTS: 'cs_comments_cache_v1',
};

// Helper: Local storage fallback cache
function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export class DatabaseService {
  private static initialized = false;

  public static async initializeCollections() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      // Check if posts exist in Firestore
      const postsRef = collection(db, 'posts');
      const snap = await getDocs(postsRef);
      if (snap.empty) {
        // Seed Firestore with initial data
        console.log('Seeding initial data into Firestore...');
        for (const post of INITIAL_POSTS) {
          await setDoc(doc(db, 'posts', post.id), post);
        }
        for (const user of INITIAL_CREATORS) {
          await setDoc(doc(db, 'users', user.id), user);
        }
        for (const live of INITIAL_LIVE_STREAMS) {
          await setDoc(doc(db, 'live_streams', live.id), live);
        }
        for (const wdr of INITIAL_WITHDRAWALS) {
          await setDoc(doc(db, 'withdrawals', wdr.id), wdr);
        }
        await setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS);
      }
    } catch (err) {
      console.warn('Firestore initialization fallback to local storage cache:', err);
    }
  }

  // --- POSTS ---
  public static subscribePosts(callback: (posts: Post[]) => void) {
    try {
      const postsRef = collection(db, 'posts');
      return onSnapshot(
        postsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Post);
            // sort by createdAt desc
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLocal(STORAGE_KEYS.POSTS, list);
            callback(list);
          } else {
            callback(getLocal(STORAGE_KEYS.POSTS, INITIAL_POSTS));
          }
        },
        (error) => {
          console.warn('Firestore posts subscription failed, using local cache:', error);
          callback(getLocal(STORAGE_KEYS.POSTS, INITIAL_POSTS));
        }
      );
    } catch (e) {
      callback(getLocal(STORAGE_KEYS.POSTS, INITIAL_POSTS));
      return () => {};
    }
  }

  public static async createPost(newPost: Post): Promise<void> {
    // 1. Update local
    const current = getLocal<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const updated = [newPost, ...current];
    setLocal(STORAGE_KEYS.POSTS, updated);

    // 2. Update Firestore
    try {
      await setDoc(doc(db, 'posts', newPost.id), newPost);
      // increment creator post count
      const userRef = doc(db, 'users', newPost.userId);
      await updateDoc(userRef, {
        'stats.postCount': increment(1),
      }).catch(() => {});
    } catch (err) {
      console.warn('Firestore write error (handled locally):', err);
    }
  }

  public static async likePost(postId: string, userId: string): Promise<boolean> {
    const current = getLocal<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    let isLiked = false;
    const updated = current.map((p) => {
      if (p.id === postId) {
        const liked = p.likedBy.includes(userId);
        isLiked = !liked;
        const newLikedBy = liked
          ? p.likedBy.filter((id) => id !== userId)
          : [...p.likedBy, userId];
        return {
          ...p,
          likedBy: newLikedBy,
          likesCount: newLikedBy.length,
        };
      }
      return p;
    });
    setLocal(STORAGE_KEYS.POSTS, updated);

    try {
      const postRef = doc(db, 'posts', postId);
      const targetPost = updated.find((p) => p.id === postId);
      if (targetPost) {
        await updateDoc(postRef, {
          likedBy: targetPost.likedBy,
          likesCount: targetPost.likesCount,
        });
      }
    } catch (err) {
      console.warn('Firestore like error:', err);
    }
    return isLiked;
  }

  public static async recordViewAndEarn(postId: string, creatorId: string, customCpm?: number): Promise<{ earned: number; newTotal: number }> {
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    
    let earnedAmount = 0;
    let newBalance = 0;

    const targetPost = posts.find((p) => p.id === postId);
    const cpm = customCpm || targetPost?.monetization.cpm || 75; // BDT per 1000 views
    earnedAmount = cpm / 1000; // e.g. ৳0.075 per view

    // Update Post
    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        const newViews = (p.viewsCount || 0) + 1;
        const newEarnings = (p.monetization?.earnings || 0) + (p.monetization?.enabled ? earnedAmount : 0);
        return {
          ...p,
          viewsCount: newViews,
          monetization: {
            ...p.monetization,
            earnings: Math.round(newEarnings * 100) / 100,
          },
        };
      }
      return p;
    });
    setLocal(STORAGE_KEYS.POSTS, updatedPosts);

    // Update Creator Wallet
    const updatedUsers = users.map((u) => {
      if (u.id === creatorId) {
        newBalance = Math.round(((u.wallet?.balance || 0) + earnedAmount) * 100) / 100;
        const totalEarned = Math.round(((u.wallet?.totalEarned || 0) + earnedAmount) * 100) / 100;
        return {
          ...u,
          wallet: {
            ...u.wallet,
            balance: newBalance,
            totalEarned: totalEarned,
            totalViews: (u.wallet?.totalViews || 0) + 1,
          },
          stats: {
            ...u.stats,
            totalViews: (u.stats?.totalViews || 0) + 1,
          },
        };
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updatedUsers);

    // Sync to Firestore
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        viewsCount: increment(1),
        'monetization.earnings': increment(earnedAmount),
      }).catch(() => {});

      const userRef = doc(db, 'users', creatorId);
      await updateDoc(userRef, {
        'wallet.balance': increment(earnedAmount),
        'wallet.totalEarned': increment(earnedAmount),
        'wallet.totalViews': increment(1),
        'stats.totalViews': increment(1),
      }).catch(() => {});
    } catch (e) {
      // offline silent handle
    }

    return { earned: earnedAmount, newTotal: newBalance };
  }

  public static async deletePost(postId: string): Promise<void> {
    const current = getLocal<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const updated = current.filter((p) => p.id !== postId);
    setLocal(STORAGE_KEYS.POSTS, updated);

    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.warn('Delete post firestore error:', e);
    }
  }

  public static async updatePostStatus(postId: string, status: 'ACTIVE' | 'FLAGGED' | 'REMOVED'): Promise<void> {
    const current = getLocal<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const updated = current.map((p) => (p.id === postId ? { ...p, status } : p));
    setLocal(STORAGE_KEYS.POSTS, updated);

    try {
      await updateDoc(doc(db, 'posts', postId), { status });
    } catch (e) {
      console.warn('Update post status error:', e);
    }
  }

  // --- USERS & AUTH ---
  public static subscribeUsers(callback: (users: UserProfile[]) => void) {
    try {
      const usersRef = collection(db, 'users');
      return onSnapshot(
        usersRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as UserProfile);
            setLocal(STORAGE_KEYS.USERS, list);
            callback(list);
          } else {
            callback(getLocal(STORAGE_KEYS.USERS, INITIAL_CREATORS));
          }
        },
        (error) => {
          console.warn('Firestore users subscribe error:', error);
          callback(getLocal(STORAGE_KEYS.USERS, INITIAL_CREATORS));
        }
      );
    } catch {
      callback(getLocal(STORAGE_KEYS.USERS, INITIAL_CREATORS));
      return () => {};
    }
  }

  public static async saveUserProfile(user: UserProfile): Promise<void> {
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    const index = users.findIndex((u) => u.id === user.id);
    let updated: UserProfile[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
    } else {
      updated = [user, ...users];
    }
    setLocal(STORAGE_KEYS.USERS, updated);

    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
      console.warn('Firestore save user profile error:', e);
    }
  }

  public static async updateUserRole(userId: string, role: UserProfile['role']): Promise<void> {
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    const updated = users.map((u) => (u.id === userId ? { ...u, role } : u));
    setLocal(STORAGE_KEYS.USERS, updated);

    try {
      await updateDoc(doc(db, 'users', userId), { role });
    } catch (e) {
      console.warn('Role update error:', e);
    }
  }

  public static async toggleUserVerification(userId: string): Promise<boolean> {
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    let newStatus = false;
    const updated = users.map((u) => {
      if (u.id === userId) {
        newStatus = !u.isVerified;
        return { ...u, isVerified: newStatus };
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updated);

    try {
      await updateDoc(doc(db, 'users', userId), { isVerified: newStatus });
    } catch (e) {
      console.warn('Verification toggle error:', e);
    }
    return newStatus;
  }

  public static async toggleUserBan(userId: string): Promise<boolean> {
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    let newStatus = false;
    const updated = users.map((u) => {
      if (u.id === userId) {
        newStatus = !u.isBanned;
        return { ...u, isBanned: newStatus };
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updated);

    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: newStatus });
    } catch (e) {
      console.warn('Ban toggle error:', e);
    }
    return newStatus;
  }

  // --- LIVE STREAMS ---
  public static subscribeLiveStreams(callback: (streams: LiveStream[]) => void) {
    try {
      const liveRef = collection(db, 'live_streams');
      return onSnapshot(
        liveRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as LiveStream);
            list.sort((a, b) => b.viewerCount - a.viewerCount);
            setLocal(STORAGE_KEYS.LIVE, list);
            callback(list);
          } else {
            callback(getLocal(STORAGE_KEYS.LIVE, INITIAL_LIVE_STREAMS));
          }
        },
        () => {
          callback(getLocal(STORAGE_KEYS.LIVE, INITIAL_LIVE_STREAMS));
        }
      );
    } catch {
      callback(getLocal(STORAGE_KEYS.LIVE, INITIAL_LIVE_STREAMS));
      return () => {};
    }
  }

  public static async createLiveStream(stream: LiveStream): Promise<void> {
    const list = getLocal<LiveStream[]>(STORAGE_KEYS.LIVE, INITIAL_LIVE_STREAMS);
    const updated = [stream, ...list];
    setLocal(STORAGE_KEYS.LIVE, updated);

    try {
      await setDoc(doc(db, 'live_streams', stream.id), stream);
    } catch (e) {
      console.warn('Live stream firestore write error:', e);
    }
  }

  public static async endLiveStream(streamId: string): Promise<void> {
    const list = getLocal<LiveStream[]>(STORAGE_KEYS.LIVE, INITIAL_LIVE_STREAMS);
    const updated = list.map((s) => (s.id === streamId ? { ...s, status: 'ENDED' as const } : s));
    setLocal(STORAGE_KEYS.LIVE, updated);

    try {
      await updateDoc(doc(db, 'live_streams', streamId), {
        status: 'ENDED',
        endedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('End stream error:', e);
    }
  }

  public static async sendLiveGift(streamId: string, hostId: string, amount: number, giftName: string, senderName: string): Promise<void> {
    // 1. Update Live Gifts Total
    const list = getLocal<LiveStream[]>(STORAGE_KEYS.LIVE, INITIAL_LIVE_STREAMS);
    const updatedStreams = list.map((s) => (s.id === streamId ? { ...s, giftsTotal: (s.giftsTotal || 0) + amount } : s));
    setLocal(STORAGE_KEYS.LIVE, updatedStreams);

    // 2. Add to Host Wallet
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    const updatedUsers = users.map((u) => {
      if (u.id === hostId) {
        return {
          ...u,
          wallet: {
            ...u.wallet,
            balance: (u.wallet?.balance || 0) + amount,
            totalEarned: (u.wallet?.totalEarned || 0) + amount,
          },
        };
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updatedUsers);

    try {
      await updateDoc(doc(db, 'live_streams', streamId), {
        giftsTotal: increment(amount),
      }).catch(() => {});

      await updateDoc(doc(db, 'users', hostId), {
        'wallet.balance': increment(amount),
        'wallet.totalEarned': increment(amount),
      }).catch(() => {});
    } catch (e) {
      console.warn('Gift send error:', e);
    }
  }

  // --- WITHDRAWALS ---
  public static subscribeWithdrawals(callback: (requests: WithdrawalRequest[]) => void) {
    try {
      const wdrRef = collection(db, 'withdrawals');
      return onSnapshot(
        wdrRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as WithdrawalRequest);
            list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
            setLocal(STORAGE_KEYS.WITHDRAWALS, list);
            callback(list);
          } else {
            callback(getLocal(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS));
          }
        },
        () => {
          callback(getLocal(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS));
        }
      );
    } catch {
      callback(getLocal(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS));
      return () => {};
    }
  }

  public static async requestWithdrawal(req: WithdrawalRequest): Promise<void> {
    const list = getLocal<WithdrawalRequest[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
    const updated = [req, ...list];
    setLocal(STORAGE_KEYS.WITHDRAWALS, updated);

    // Deduct from available balance, put into pending
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    const updatedUsers = users.map((u) => {
      if (u.id === req.userId) {
        return {
          ...u,
          wallet: {
            ...u.wallet,
            balance: Math.max(0, u.wallet.balance - req.amount),
            pendingWithdrawal: (u.wallet.pendingWithdrawal || 0) + req.amount,
          },
        };
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updatedUsers);

    try {
      await setDoc(doc(db, 'withdrawals', req.id), req);
      await updateDoc(doc(db, 'users', req.userId), {
        'wallet.balance': increment(-req.amount),
        'wallet.pendingWithdrawal': increment(req.amount),
      });
    } catch (e) {
      console.warn('Withdrawal write error:', e);
    }
  }

  public static async processWithdrawal(withdrawalId: string, status: 'APPROVED' | 'REJECTED', adminNote: string, transactionId?: string): Promise<void> {
    const list = getLocal<WithdrawalRequest[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
    const target = list.find((w) => w.id === withdrawalId);
    if (!target) return;

    const updated = list.map((w) => {
      if (w.id === withdrawalId) {
        return {
          ...w,
          status,
          adminNote,
          transactionId: transactionId || `TXN-CS-${Math.floor(100000 + Math.random() * 900000)}`,
          processedAt: new Date().toISOString(),
        };
      }
      return w;
    });
    setLocal(STORAGE_KEYS.WITHDRAWALS, updated);

    // Update user wallet
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_CREATORS);
    const updatedUsers = users.map((u) => {
      if (u.id === target.userId) {
        if (status === 'REJECTED') {
          // Refund balance if rejected
          return {
            ...u,
            wallet: {
              ...u.wallet,
              balance: u.wallet.balance + target.amount,
              pendingWithdrawal: Math.max(0, u.wallet.pendingWithdrawal - target.amount),
            },
          };
        } else {
          // Clear pending if approved
          return {
            ...u,
            wallet: {
              ...u.wallet,
              pendingWithdrawal: Math.max(0, u.wallet.pendingWithdrawal - target.amount),
            },
          };
        }
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updatedUsers);

    try {
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status,
        adminNote,
        transactionId: transactionId || `TXN-CS-${Math.floor(100000 + Math.random() * 900000)}`,
        processedAt: new Date().toISOString(),
      });

      if (status === 'REJECTED') {
        await updateDoc(doc(db, 'users', target.userId), {
          'wallet.balance': increment(target.amount),
          'wallet.pendingWithdrawal': increment(-target.amount),
        });
      } else {
        await updateDoc(doc(db, 'users', target.userId), {
          'wallet.pendingWithdrawal': increment(-target.amount),
        });
      }
    } catch (e) {
      console.warn('Process withdrawal error:', e);
    }
  }

  // --- SETTINGS ---
  public static subscribeSettings(callback: (settings: SystemSettings) => void) {
    try {
      const setRef = doc(db, 'settings', 'global');
      return onSnapshot(
        setRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SystemSettings;
            setLocal(STORAGE_KEYS.SETTINGS, data);
            callback(data);
          } else {
            callback(getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
          }
        },
        () => {
          callback(getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
        }
      );
    } catch {
      callback(getLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
      return () => {};
    }
  }

  public static async updateSettings(settings: SystemSettings): Promise<void> {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
    } catch (e) {
      console.warn('Settings update error:', e);
    }
  }

  // --- COMMENTS ---
  public static getLocalComments(postId: string): Comment[] {
    const all = getLocal<Record<string, Comment[]>>(STORAGE_KEYS.COMMENTS, {
      post_video_001: [
        {
          id: 'c1',
          postId: 'post_video_001',
          userId: 'creator_tania_002',
          userName: 'Tania Rahman',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          userVerified: true,
          text: 'দারুণ উদ্যোগ ভাইয়া! নতুন ক্রিয়েটরদের জন্য অনেক বড় সুযোগ 💖',
          createdAt: '2025-09-10T11:00:00.000Z',
          likes: 42,
        },
        {
          id: 'c2',
          postId: 'post_video_001',
          userId: 'creator_arafat_003',
          userName: 'Arafat Hossain',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          userVerified: true,
          text: 'bKash ও Nagad এ ইনস্ট্যান্ট পেআউট কাজ করছে দারুণভাবে। লাভ ইট 🔥',
          createdAt: '2025-09-11T09:30:00.000Z',
          likes: 29,
        },
      ],
      post_photo_002: [
        {
          id: 'c3',
          postId: 'post_photo_002',
          userId: 'admin_rasel_001',
          userName: 'Md Rasel Ahmed',
          userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          userVerified: true,
          text: 'অসাধারণ ফটোশুট তানিয়া! কালার গ্রেডিং এবং লাইটিং চমৎকার হয়েছে 👌',
          createdAt: '2025-09-12T15:00:00.000Z',
          likes: 18,
        },
      ],
    });
    return all[postId] || [];
  }

  public static async addComment(postId: string, comment: Comment): Promise<void> {
    const all = getLocal<Record<string, Comment[]>>(STORAGE_KEYS.COMMENTS, {});
    const list = all[postId] || [];
    all[postId] = [comment, ...list];
    setLocal(STORAGE_KEYS.COMMENTS, all);

    // Update post comments count
    const posts = getLocal<Post[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
    );
    setLocal(STORAGE_KEYS.POSTS, updatedPosts);

    try {
      const commentsColl = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsColl, comment);
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1),
      });
    } catch (e) {
      console.warn('Comment write error:', e);
    }
  }
}
