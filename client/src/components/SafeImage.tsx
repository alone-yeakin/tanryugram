import React from "react";
import { initialsAvatar, mediaSource } from "@/lib/mediaUrl";

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
  fallback?: string;
  fallbackName?: string | null;
};

export function SafeImage({ src, alt = "", fallback, fallbackName, onError, ...props }: SafeImageProps) {
  const fallbackSource = fallback || initialsAvatar(fallbackName || alt || "Tanryugram user");
  return (
    <img
      {...props}
      src={mediaSource(src, fallbackSource)}
      alt={alt}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallbackSource;
        onError?.(event);
      }}
    />
  );
}
