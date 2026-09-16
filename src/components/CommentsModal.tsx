import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Heart,
  MessageCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { Post, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/dbService';

interface CommentsModalProps {
  post: Post;
  onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ post, onClose }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const list = DatabaseService.getLocalComments(post.id);
    setComments(list);
  }, [post.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    const item: Comment = {
      id: `comment_${Date.now()}`,
      postId: post.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      userVerified: currentUser.isVerified,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    await DatabaseService.addComment(post.id, item);
    setComments((prev) => [item, ...prev]);
    setNewComment('');
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[80vh] sm:h-[650px] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100">কমেন্টসমূহ ({comments.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              প্রথম কমেন্টকারী হোন! 💬
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <img
                  src={c.userAvatar}
                  alt={c.userName}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-800"
                />
                <div className="flex-1 bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">{c.userName}</span>
                      {c.userVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="আপনার সুন্দর মতামত লিখুন..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-rose-500 outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
