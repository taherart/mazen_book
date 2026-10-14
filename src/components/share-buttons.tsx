"use client";

import { Check, Link2, Share2 } from "@/components/icons";
import { useState } from "react";
import { cx } from "./ui";

/** Share intents where the network has one; TikTok and Instagram have none on the web, so they get copy / the phone's share sheet. */
export function ShareButtons({ path, title, className }: { path: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => new URL(path, window.location.origin).toString();
  const open = (make: (u: string, t: string) => string) => window.open(make(encodeURIComponent(url()), encodeURIComponent(title)), "_blank", "noopener,noreferrer");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("انسخ الرابط:", url());
    }
  };
  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: url() });
      } catch {
        // the visitor closed the sheet
      }
    } else {
      void copy();
    }
  };

  const pill = "inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink bg-white px-4 text-sm font-bold text-ink transition hover:bg-brand-wash";
  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)}>
      <button type="button" className={pill} onClick={() => open((u, t) => `https://wa.me/?text=${t}%20${u}`)}>
        واتساب
      </button>
      <button type="button" className={pill} onClick={() => open((u, t) => `https://x.com/intent/post?text=${t}&url=${u}`)}>
        إكس
      </button>
      <button type="button" className={pill} onClick={() => open((u) => `https://www.snapchat.com/share?link=${u}`)}>
        سناب شات
      </button>
      <button type="button" className={pill} onClick={native} title="تيك توك وإنستغرام وغيرها عبر قائمة المشاركة في جوالك">
        <Share2 aria-hidden className="size-4" />
        تطبيق آخر
      </button>
      <button type="button" className={cx(pill, copied && "border-ok bg-ok-wash text-ok")} onClick={copy} aria-live="polite">
        {copied ? <Check aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}
        {copied ? "نُسخ الرابط" : "نسخ الرابط"}
      </button>
    </div>
  );
}
