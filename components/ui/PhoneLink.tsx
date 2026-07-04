"use client";

import { useState, type ReactNode } from "react";

type PhoneLinkProps = {
  phone: string;
  className?: string;
  children: ReactNode;
};

/**
 * Phone link that dials on touch devices (tel:) and copies to clipboard
 * on desktop, where tel: otherwise pops a "choose an app" dialog.
 */
export default function PhoneLink({ phone, className, children }: PhoneLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Touch devices (no hover) can actually dial — let the tel: link work.
    const canDial =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches;
    if (canDial) return;

    // Desktop: don't open the app-picker dialog, copy the number instead.
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — fall back to default tel: behavior.
    }
  };

  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      onClick={handleClick}
      title={copied ? "Copied!" : `Copy ${phone}`}
      className={`relative ${className ?? ""}`}
    >
      {children}
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0F2830] px-2 py-1 text-xs font-medium text-white shadow-lg">
          Copied!
        </span>
      )}
    </a>
  );
}
