"use client";

import { useEffect } from "react";
import { refreshSession } from "@/lib/session-client";

/** Loads the server session into the store once per page load. */
export function SessionSync() {
  useEffect(() => {
    void refreshSession();
  }, []);
  return null;
}
