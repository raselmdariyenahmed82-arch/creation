export type UserRole = 'MAIN_ADMIN' | 'SIDE_ADMIN' | 'CREATOR' | 'VIEWER';

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
  mediaUrl: string;                  // Primary video URL or photo URL
  additionalMediaUrls?: string[];    // Extra photos for photo sessions / album
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  duration?: number;                 // in seconds for video
  viewsCount: number;
  likesCount: number;
  likedBy: string[];                 // Array of user IDs
  commentsCount: number;
  monetization: PostMonetization;
  status: 'ACTIVE' | 'FLAGGED' | 'REMOVED';
  photoTheme?: string;               // e.g. "Sunset Portrait", "Fashion Model", "Nature & Urban"
  createdAt: string;
}

export interface LiveChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  type: 'CHAT' | 'GIFT' | 'SYSTEM';
  giftAmount?: number;
  giftName?: string;
  createdAt: string;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostUsername: string;
  hostAvatar: string;
  hostRole: UserRole;
  hostVerified: boolean;
  title: string;
  category: string;
  status: 'LIVE' | 'ENDED';
  viewerCount: number;
  peakViewers: number;
  streamUrl?: string;               // WebRTC video track or simulated video loop
  thumbnailUrl: string;
  giftsTotal: number;
  startedAt: string;
  endedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userVerified?: boolean;
  text: string;
  createdAt: string;
  likes: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'PayPal';
  accountNumber: string;
  accountHolder?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  adminNote?: string;
}

export interface SystemSettings {
  defaultCpmRate: number;           // Default BDT per 1000 views (e.g. ৳60)
  minWithdrawalAmount: number;      // Minimum amount to withdraw (e.g. ৳500)
  platformFeePercent: number;       // Platform commission % (e.g. 10%)
  allowNewRegistrations: boolean;
  mainAdminEmail: string;
}
