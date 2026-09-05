import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

/** Admin feedback is only needed on admin routes. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      {children}
    </>
  );
}
