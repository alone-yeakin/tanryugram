import React, { useEffect, useState } from "react";
import { initialsAvatar, mediaSource } from "@/lib/mediaUrl";

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
  fallback?: string;
  fallbackName?: string | null;
};

export function SafeImage({ src, alt = "", fallback, fallbackName, onError, ...props }: SafeImageProps) {
  const fallbackSource = fallback || initialsAvatar(fallbackName || alt || "Tanryugram user");
  const resolvedSource = mediaSource(src, fallbackSource);
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    setFailedSource(null);
  }, [resolvedSource]);

  const renderedSource = failedSource === resolvedSource ? fallbackSource : resolvedSource;

  return (
    <img
      {...props}
      src={renderedSource}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src === resolvedSource || event.currentTarget.currentSrc === resolvedSource) {
          setFailedSource(resolvedSource);
        }
        onError?.(event);
      }}
    />
  );
}
