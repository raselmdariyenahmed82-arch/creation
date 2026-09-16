import React, { createContext, useContext, useState, useEffect } from 'react';
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
  login: (email: string, pass?: string) => Promise<boolean>;
  signup: (data: Partial<UserProfile>) => Promise<boolean>;
  switchProfile: (userId: string) => void;
  updateUserWallet: (newBalance: number) => void;
  logout: () => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'cs_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_CREATORS);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_USER_KEY) || INITIAL_ADMIN_USER.id;
  });

  useEffect(() => {
    // Initialize Firestore collections & subscribe to users
    DatabaseService.initializeCollections();
    const unsub = DatabaseService.subscribeUsers((updatedUsers) => {
      setUsers(updatedUsers);
    });
    return () => unsub();
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || INITIAL_ADMIN_USER;

  const isMainAdmin = currentUser?.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase() || currentUser?.role === 'MAIN_ADMIN';
  const isSideAdmin = isMainAdmin || currentUser?.role === 'SIDE_ADMIN';
  const isCreator = isSideAdmin || currentUser?.role === 'CREATOR';

  const switchProfile = (userId: string) => {
    setCurrentUserId(userId);
    localStorage.setItem(CURRENT_USER_KEY, userId);
  };

  const login = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Auto-create if it's main admin email
      if (cleanEmail === MAIN_ADMIN_EMAIL.toLowerCase()) {
        found = {
          ...INITIAL_ADMIN_USER,
          email: MAIN_ADMIN_EMAIL,
        };
        await DatabaseService.saveUserProfile(found);
      } else {
        // Create standard creator profile
        const newId = `user_${Date.now()}`;
        const newName = cleanEmail.split('@')[0];
        found = {
          id: newId,
          email: cleanEmail,
          name: newName.charAt(0).toUpperCase() + newName.slice(1),
          username: newName.replace(/[^a-zA-Z0-9_]/g, '_'),
          avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80`,
          role: 'CREATOR',
          isVerified: false,
          isBanned: false,
          wallet: {
            balance: 0,
            totalEarned: 0,
            pendingWithdrawal: 0,
            cpmRate: 75,
            totalViews: 0,
          },
          stats: {
            followersCount: 0,
            followingCount: 0,
            totalViews: 0,
            totalLikes: 0,
            postCount: 0,
          },
          createdAt: new Date().toISOString(),
        };
        await DatabaseService.saveUserProfile(found);
      }
    }

    if (found.isBanned) {
      alert('আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Banned) করা হয়েছে। দয়া করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
      return false;
    }

    setCurrentUserId(found.id);
    localStorage.setItem(CURRENT_USER_KEY, found.id);
    return true;
  };

  const signup = async (data: Partial<UserProfile>): Promise<boolean> => {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const isMain = cleanEmail === MAIN_ADMIN_EMAIL.toLowerCase();

    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      email: cleanEmail,
      name: data.name || cleanEmail.split('@')[0],
      username: data.username || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'),
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      bio: data.bio || 'New content creator on CreatorStream 🎬 📸',
      role: isMain ? 'MAIN_ADMIN' : ((data.role as UserRole) || 'CREATOR'),
      isVerified: isMain,
      isBanned: false,
      wallet: {
        balance: 0,
        totalEarned: 0,
        pendingWithdrawal: 0,
        cpmRate: 75,
        totalViews: 0,
      },
      stats: {
        followersCount: 0,
        followingCount: 0,
        totalViews: 0,
        totalLikes: 0,
        postCount: 0,
      },
      createdAt: new Date().toISOString(),
      paymentInfo: data.paymentInfo,
    };

    await DatabaseService.saveUserProfile(newUser);
    setCurrentUserId(newUser.id);
    localStorage.setItem(CURRENT_USER_KEY, newUser.id);
    return true;
  };

  const updateUserWallet = (newBalance: number) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      wallet: {
        ...currentUser.wallet,
        balance: newBalance,
      },
    };
    DatabaseService.saveUserProfile(updated);
  };

  const logout = () => {
    // Switch to first viewer or guest
    const guestUser = users.find((u) => u.role === 'VIEWER') || users[1] || users[0];
    if (guestUser) {
      setCurrentUserId(guestUser.id);
      localStorage.setItem(CURRENT_USER_KEY, guestUser.id);
    }
  };

  const refreshUsers = () => {
    // trigger state update
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isMainAdmin,
        isSideAdmin,
        isCreator,
        login,
        signup,
        switchProfile,
        updateUserWallet,
        logout,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
