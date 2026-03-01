"use client";

import { useRef, useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface UploadScannerProps {
  userId: string;
  onBudgetUpdate?: () => void;
}

export default function UploadScanner({ userId, onBudgetUpdate }: UploadScannerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const toastId = toast.loading("Scanning with Gemini AI…");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${apiBase}/api/scan-calendar?user_id=${encodeURIComponent(userId)}`,
        { method: "POST", body: form },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Scan failed");
      }

      const data = await res.json();
      const count = data.expenses?.length ?? 0;

      toast.success(`Imported ${count} expense${count !== 1 ? "s" : ""} from scan!`, {
        id: toastId,
        description: "Your budget has been updated.",
      });

      onBudgetUpdate?.();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong", {
        id: toastId,
      });
    } finally {
      setScanning(false);
      // Reset so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        disabled={scanning}
        onClick={() => fileRef.current?.click()}
        className="gap-2 border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-text)] hover:bg-[var(--theme-primary)]/10 transition-all"
      >
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ScanLine className="h-4 w-4" />
        )}
        {scanning ? "Scanning…" : "Scan Calendar with AI"}
      </Button>
    </>
  );
}
