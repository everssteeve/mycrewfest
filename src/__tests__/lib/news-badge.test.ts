import { describe, expect, it } from "vitest";
import {
  computeNewsStatus,
  getNewsBadgeColor,
  getNewsBadgeLabel,
  isRecentPublishDate,
} from "@/lib/news-badge";

describe("computeNewsStatus", () => {
  it("returns null when count is 0", () => {
    expect(computeNewsStatus(0, false)).toBeNull();
    expect(computeNewsStatus(0, true)).toBeNull();
  });

  it("returns 'urgent' when count > 0 and has urgent news", () => {
    expect(computeNewsStatus(1, true)).toBe("urgent");
    expect(computeNewsStatus(5, true)).toBe("urgent");
  });

  it("returns 'normal' when count > 0 and no urgent news", () => {
    expect(computeNewsStatus(1, false)).toBe("normal");
    expect(computeNewsStatus(3, false)).toBe("normal");
  });
});

describe("isRecentPublishDate", () => {
  const now = new Date("2026-05-23T12:00:00Z");

  it("returns true for a date published today", () => {
    expect(isRecentPublishDate("2026-05-23T08:00:00Z", now)).toBe(true);
  });

  it("returns true for a date published 6 days ago", () => {
    expect(isRecentPublishDate("2026-05-17T08:00:00Z", now)).toBe(true);
  });

  it("returns false for a date published 8 days ago", () => {
    expect(isRecentPublishDate("2026-05-15T08:00:00Z", now)).toBe(false);
  });

  it("returns false for a future date", () => {
    expect(isRecentPublishDate("2026-05-30T08:00:00Z", now)).toBe(false);
  });
});

describe("getNewsBadgeLabel", () => {
  it("returns alert label for urgent", () => {
    expect(getNewsBadgeLabel("urgent")).toBe("⚠ Alerte");
  });

  it("returns new label for normal", () => {
    expect(getNewsBadgeLabel("normal")).toBe("Nouveau");
  });

  it("returns empty string for null", () => {
    expect(getNewsBadgeLabel(null)).toBe("");
  });
});

describe("getNewsBadgeColor", () => {
  it("returns danger-red for urgent", () => {
    expect(getNewsBadgeColor("urgent")).toContain("#FF3355");
  });

  it("returns warning-orange for normal", () => {
    expect(getNewsBadgeColor("normal")).toContain("#FF9900");
  });

  it("returns transparent for null", () => {
    expect(getNewsBadgeColor(null)).toBe("transparent");
  });
});
