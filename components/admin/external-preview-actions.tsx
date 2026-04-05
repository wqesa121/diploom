"use client";

import { Copy, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ExternalPreviewActionsProps = {
  href: string;
};

export function ExternalPreviewActions({ href }: ExternalPreviewActionsProps) {
  const absoluteHref = typeof window === "undefined" ? href : new URL(href, window.location.origin).toString();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(absoluteHref);
      toast.success("Preview link copied.");
    } catch {
      toast.error("Failed to copy preview link.");
    }
  }

  async function handleShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: "NeuraCMS Preview",
        text: "Private preview link",
        url: absoluteHref,
      });
    } catch {
      // Ignore user-cancelled share flow.
    }
  }

  return (
    <div className="space-y-3 rounded-[1.25rem] border bg-secondary/30 p-4">
      <Input value={absoluteHref} readOnly className="bg-white" aria-label="External preview link" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          Copy link
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={href} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open
          </a>
        </Button>
      </div>
    </div>
  );
}