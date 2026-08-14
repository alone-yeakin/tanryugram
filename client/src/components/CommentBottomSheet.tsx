import React, { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SafeImage } from "@/components/SafeImage";

interface CommentBottomSheetProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function CommentBottomSheet({ postId, isOpen, onClose, onCommentAdded }: CommentBottomSheetProps) {
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();
  const commentsQuery = trpc.posts.comments.useQuery({ postId }, { enabled: isOpen && postId > 0 });
  const commentMutation = trpc.posts.comment.useMutation({
    onSuccess: () => {
      setContent("");
      utils.posts.comments.invalidate({ postId });
      toast.success("Comment added successfully");
      if (onCommentAdded) onCommentAdded();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add comment");
    }
  });

  if (!isOpen) return null;

  const comments = commentsQuery.data || [];

  const handleSend = () => {
    if (!content.trim()) return;
    commentMutation.mutate({ postId, content: content.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-[32px] bg-card border border-border shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-500" />
            <h3 className="font-semibold text-base">Comments ({comments.length})</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close comments"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {commentsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="mx-auto h-12 w-12 opacity-30 mb-2" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Start the conversation by leaving a comment below.</p>
            </div>
          ) : (
            comments.map((entry: any) => {
              const comment = entry.comment;
              const author = entry.author;
              const timeFormatted = new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={comment.id} className="flex items-start gap-3 group">
                  <SafeImage
                    src={author.avatarUrl}
                    fallbackName={author.name || author.username || "User"}
                    alt={author.name || "User"}
                    className="h-10 w-10 rounded-full object-cover shrink-0 border border-border"
                  />
                  <div className="flex-1 min-w-0 bg-muted/50 rounded-2xl px-4 py-3 border border-border/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{author.name || author.username || "User"}</span>
                      <span className="text-[10px] text-muted-foreground">{timeFormatted}</span>
                    </div>
                    <p className="text-sm text-foreground break-words leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-border/60 bg-card">
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 focus-within:ring-2 focus-within:ring-violet-500/30">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a thoughtful comment..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              disabled={!content.trim() || commentMutation.isPending}
              onClick={handleSend}
              className="rounded-full bg-violet-600 p-2 text-white transition-all hover:bg-violet-700 disabled:opacity-40 disabled:hover:bg-violet-600"
              aria-label="Send comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
