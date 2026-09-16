import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Feed } from './components/Feed';
import { MonetizationCenter } from './components/MonetizationCenter';
import { AdminPanel } from './components/AdminPanel';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { LiveStudio } from './components/LiveStudio';
import { LiveRoomModal } from './components/LiveRoomModal';
import { CreateModal } from './components/CreateModal';
import { CommentsModal } from './components/CommentsModal';
import { TipModal } from './components/TipModal';
import { AuthModal } from './components/AuthModal';
import { Post, LiveStream } from './types';

function MainAppContent() {
  const { currentUser, isMainAdmin, isSideAdmin } = useAuth();

  const [currentView, setCurrentView] = useState<'FEED' | 'MONETIZATION' | 'ADMIN' | 'SOURCE_CODE'>('FEED');

  // Modals state
  const [showLiveStudio, setShowLiveStudio] = useState(false);
  const [activeLiveRoom, setActiveLiveRoom] = useState<LiveStream | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [tipPost, setTipPost] = useState<Post | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenLiveStudio={() => setShowLiveStudio(true)}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 py-6 px-3 sm:px-6">
        {currentView === 'FEED' && (
          <Feed
            onOpenComments={(post) => setCommentPost(post)}
            onOpenTipModal={(post) => setTipPost(post)}
            onOpenLiveRoom={(stream) => setActiveLiveRoom(stream)}
            onOpenLiveStudio={() => setShowLiveStudio(true)}
            onOpenCreateModal={() => setShowCreateModal(true)}
          />
        )}

        {currentView === 'MONETIZATION' && <MonetizationCenter />}

        {currentView === 'ADMIN' && <AdminPanel />}

        {currentView === 'SOURCE_CODE' && <SourceCodeViewer />}
      </main>

      {/* Modals */}
      {showLiveStudio && (
        <LiveStudio onClose={() => setShowLiveStudio(false)} />
      )}

      {activeLiveRoom && (
        <LiveRoomModal
          stream={activeLiveRoom}
          onClose={() => setActiveLiveRoom(null)}
        />
      )}

      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            // refresh or stay on feed
            setCurrentView('FEED');
          }}
        />
      )}

      {commentPost && (
        <CommentsModal
          post={commentPost}
          onClose={() => setCommentPost(null)}
        />
      )}

      {tipPost && (
        <TipModal
          post={tipPost}
          onClose={() => setTipPost(null)}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
