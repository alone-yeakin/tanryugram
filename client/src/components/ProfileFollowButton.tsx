import React from "react";

type ProfileFollowButtonProps = {
  isAuthenticated: boolean;
  isFollowing: boolean;
  isPending: boolean;
  onFollow: () => void;
  onLogin: () => void;
};

export function ProfileFollowButton({ isAuthenticated, isFollowing, isPending, onFollow, onLogin }: ProfileFollowButtonProps) {
  return (
    <button
      type="button"
      onClick={isAuthenticated ? onFollow : onLogin}
      disabled={isPending}
      aria-pressed={isFollowing}
      data-following={isFollowing ? "true" : "false"}
      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition active:scale-[.98] disabled:cursor-wait disabled:opacity-60 ${isFollowing ? "border border-violet-300 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-foreground text-background hover:opacity-90"}`}
    >
      {isPending ? "Updating…" : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
