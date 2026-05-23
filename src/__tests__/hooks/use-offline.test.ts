/**
 * Tests for useOffline hook.
 *
 * Verifies that isOffline toggles correctly in response to browser
 * "online" and "offline" window events.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOffline } from "@/hooks/use-offline";
import { useAppStore } from "@/store/use-app-store";

// Mock the offline sync helpers — they make fetch calls we don't want in unit tests
vi.mock("@/lib/offline", () => ({
  syncPendingSelections: vi.fn().mockResolvedValue(undefined),
  syncPendingSouvenirs: vi.fn().mockResolvedValue(undefined),
  queueSouvenirOffline: vi.fn().mockResolvedValue(undefined),
  cacheFestivals: vi.fn().mockResolvedValue(undefined),
  searchFestivalsOffline: vi.fn().mockResolvedValue([]),
  cacheEvents: vi.fn().mockResolvedValue(undefined),
  getEventsOffline: vi.fn().mockResolvedValue([]),
  db: {},
}));

beforeEach(() => {
  useAppStore.setState({
    isOffline: false,
    offlineSyncQueue: [],
    festivalMode: false,
    currentFestEventId: null,
  });

  // Default: browser is online
  Object.defineProperty(navigator, "onLine", {
    writable: true,
    value: true,
  });
});

describe("useOffline", () => {
  it("initialises isOffline from navigator.onLine=true", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: true });
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOffline).toBe(false);
  });

  it("initialises isOffline from navigator.onLine=false", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false });
    const { result } = renderHook(() => useOffline());
    expect(result.current.isOffline).toBe(true);
  });

  it("sets isOffline=true when the 'offline' event fires", () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOffline).toBe(true);
  });

  it("sets isOffline=false when the 'online' event fires", () => {
    // Start offline
    useAppStore.setState({ isOffline: true });
    const { result } = renderHook(() => useOffline());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOffline).toBe(false);
  });

  it("sets syncPending=true briefly when 'online' event fires", async () => {
    const { result } = renderHook(() => useOffline());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    // syncPending should be true immediately after firing online
    expect(result.current.syncPending).toBe(true);
  });

  it("returns syncPending=false when idle", () => {
    const { result } = renderHook(() => useOffline());
    expect(result.current.syncPending).toBe(false);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
