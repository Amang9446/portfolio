"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ViewCount from "./view-count";

interface PostViewTrackerProps {
  postId: string;
  initialCount: number;
}

export default function PostViewTracker({
  postId,
  initialCount,
}: PostViewTrackerProps) {
  const [count, setCount] = useState(initialCount);
  const recorded = useRef(false);

  useEffect(() => {
    // Local visual checks may use production-backed environment variables.
    if (process.env.NODE_ENV !== "production") return;

    // React may replay effects during development. Keep one increment for this
    // page mount while still counting a refresh or later return as a new visit.
    if (recorded.current) return;
    recorded.current = true;

    const recordView = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("record_post_view", {
        target_post_id: postId,
      });

      if (error) {
        console.error("Failed to record post view:", error.message);
        return;
      }

      const nextCount = Number(data);
      if (Number.isFinite(nextCount)) setCount(nextCount);
    };

    void recordView();
  }, [postId]);

  return <ViewCount count={count} />;
}
