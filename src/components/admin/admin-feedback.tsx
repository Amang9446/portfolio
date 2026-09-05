"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  adminNoticeMessages,
  resolveAdminErrorMessage,
  type AdminNotice,
} from "@/lib/admin-feedback";

export default function AdminFeedback() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const error = searchParams.get("error");
  const shownFeedback = useRef<string | null>(null);

  useEffect(() => {
    const feedbackKey = notice
      ? `notice:${notice}`
      : error
        ? `error:${error}`
        : null;

    if (!feedbackKey) {
      shownFeedback.current = null;
      return;
    }
    if (shownFeedback.current === feedbackKey) return;
    shownFeedback.current = feedbackKey;

    if (error) {
      toast.error(resolveAdminErrorMessage(error));
    } else if (notice) {
      toast.success(
        adminNoticeMessages[notice as AdminNotice] ?? "Changes saved.",
      );
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("notice");
    nextParams.delete("error");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [error, notice, pathname, router, searchParams]);

  return null;
}
