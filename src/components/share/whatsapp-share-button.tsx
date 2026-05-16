"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  /** Pre-built WhatsApp text */
  text: string;
  /** Trigger label */
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

export function WhatsAppShareButton({
  text,
  label = "Bagikan ke WhatsApp",
  variant = "default",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Teks laporan disalin");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleShare = (target: "general" | "phone") => {
    const encoded = encodeURIComponent(text);
    let url: string;
    if (target === "phone" && phone.trim()) {
      const cleaned = phone.replace(/[^\d]/g, "");
      // Indonesia: convert leading 0 to 62
      const normalized = cleaned.startsWith("0")
        ? `62${cleaned.slice(1)}`
        : cleaned;
      url = `https://wa.me/${normalized}?text=${encoded}`;
    } else {
      url = `https://wa.me/?text=${encoded}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const baseBtn = cn(
    "inline-flex items-center gap-2 rounded-md font-medium transition-colors active:scale-[0.98]",
    size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
    variant === "default" &&
      "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
    variant === "outline" &&
      "border border-border bg-card hover:bg-accent",
    variant === "ghost" && "hover:bg-accent",
    className,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={baseBtn}
        aria-label={label}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">WA</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Bagikan Laporan ke WhatsApp"
        description="Pratinjau teks ringkasan. Salin atau kirim langsung."
        size="lg"
      >
        <div className="space-y-4 p-6">
          {/* Preview */}
          <div className="rounded-lg border border-border bg-[#e7f8ee] p-4 dark:bg-emerald-950/30">
            <pre className="max-h-[42vh] overflow-auto whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-foreground scrollbar-thin">
              {text}
            </pre>
          </div>

          {/* Phone-targeted send */}
          <div className="space-y-1.5">
            <label
              htmlFor="wa-phone"
              className="text-xs font-medium text-muted-foreground"
            >
              Nomor WhatsApp tujuan (opsional)
            </label>
            <div className="flex gap-2">
              <input
                id="wa-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="mis. 081234567890"
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                onClick={() => handleShare("phone")}
                disabled={!phone.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Share2 className="h-4 w-4" />
                Kirim
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Awalan 0 akan otomatis diganti +62. Kosongkan kalau mau pilih
              kontak manual.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
              Tutup
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className={cn(copied && "border-emerald-500 text-emerald-600")}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Salin Teks
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleShare("general")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              Buka WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
