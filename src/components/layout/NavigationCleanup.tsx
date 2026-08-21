"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function NavigationCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // Radix UI sometimes leaves pointer-events: none on the body 
    // when a route change unmounts a Dialog or Sheet abruptly.
    // This cleanup ensures pointer-events are restored on every route change.
    document.body.style.pointerEvents = "auto";
  }, [pathname]);

  return null;
}
