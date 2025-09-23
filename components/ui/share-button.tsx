"use client";

import React from "react";
import toast from "react-hot-toast";
import { ShareIcon } from "@heroicons/react/24/outline";

type ShareButtonProps = {
  title: string;
  description?: string;
  url?: string;
  className?: string;
};

export default function ShareButton({ title, description, url, className }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
      const text = description || title;

      if (typeof navigator !== "undefined" && (navigator as any).share) {
        try {
          await (navigator as any).share({ title, text, url: shareUrl });
          // Some browsers don't resolve if user cancels; no toast needed on success
          return;
        } catch (e: any) {
          if (e?.name === "AbortError") return; // user cancelled
          // fall through to copy
        }
      }

      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } else {
        toast.error("Unable to share. No URL available.");
      }
    } catch (err) {
      console.error("Share failed:", err);
      try {
        if (typeof window !== "undefined") {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
          return;
        }
      } catch {}
      toast.error("Failed to share");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this page"
      className={
        className ||
        "inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      }
    >
      <ShareIcon className="w-4 h-4 mr-2" />
      Share
    </button>
  );
}

