"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Terjadi kesalahan</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {error.message ||
          "Kesalahan tak terduga. Coba muat ulang halaman."}
      </p>
      <Button onClick={reset} className="mt-5">
        Coba lagi
      </Button>
    </div>
  );
}
