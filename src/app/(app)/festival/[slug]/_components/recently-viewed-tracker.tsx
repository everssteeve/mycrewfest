"use client";

import { useEffect } from "react";
import {
  loadRecentlyViewed,
  addToRecentlyViewed,
  saveRecentlyViewed,
} from "@/lib/recently-viewed";

interface Props {
  slug: string;
  name: string;
  city: string;
}

export function RecentlyViewedTracker({ slug, name, city }: Props) {
  useEffect(() => {
    const current = loadRecentlyViewed();
    const next = addToRecentlyViewed({ slug, name, city }, current);
    saveRecentlyViewed(next);
  }, [slug, name, city]);

  return null;
}
