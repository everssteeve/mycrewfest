import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/use-app-store";
import type { SyncOperation } from "@/types";

// Reset Zustand store state between tests
beforeEach(() => {
  useAppStore.setState({
    isOffline: false,
    offlineSyncQueue: [],
    festivalMode: false,
    currentFestEventId: null,
  });
});

const makeSyncOp = (id: string): SyncOperation => ({
  id,
  type: "selection",
  endpoint: `/api/festevents/fe-1/selections`,
  method: "POST",
  body: { eventId: "ev-1", status: "must-see" },
  createdAt: new Date().toISOString(),
});

describe("useAppStore", () => {
  it("setOffline(true) sets isOffline to true", () => {
    useAppStore.getState().setOffline(true);
    expect(useAppStore.getState().isOffline).toBe(true);
  });

  it("setOffline(false) sets isOffline to false", () => {
    useAppStore.setState({ isOffline: true });
    useAppStore.getState().setOffline(false);
    expect(useAppStore.getState().isOffline).toBe(false);
  });

  it("addToSyncQueue(op) adds the operation to the queue", () => {
    const op = makeSyncOp("op-1");
    useAppStore.getState().addToSyncQueue(op);
    const queue = useAppStore.getState().offlineSyncQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual(op);
  });

  it("addToSyncQueue appends multiple operations", () => {
    useAppStore.getState().addToSyncQueue(makeSyncOp("op-1"));
    useAppStore.getState().addToSyncQueue(makeSyncOp("op-2"));
    expect(useAppStore.getState().offlineSyncQueue).toHaveLength(2);
  });

  it("clearSyncQueue() empties the queue", () => {
    useAppStore.getState().addToSyncQueue(makeSyncOp("op-1"));
    useAppStore.getState().addToSyncQueue(makeSyncOp("op-2"));
    useAppStore.getState().clearSyncQueue();
    expect(useAppStore.getState().offlineSyncQueue).toHaveLength(0);
  });

  it("setFestivalMode(true) sets festivalMode to true", () => {
    useAppStore.getState().setFestivalMode(true);
    expect(useAppStore.getState().festivalMode).toBe(true);
  });

  it("setFestivalMode(false) sets festivalMode to false", () => {
    useAppStore.setState({ festivalMode: true });
    useAppStore.getState().setFestivalMode(false);
    expect(useAppStore.getState().festivalMode).toBe(false);
  });

  it("setCurrentFestEventId sets the ID", () => {
    useAppStore.getState().setCurrentFestEventId("fe-42");
    expect(useAppStore.getState().currentFestEventId).toBe("fe-42");
  });

  it("setCurrentFestEventId(null) clears the ID", () => {
    useAppStore.setState({ currentFestEventId: "fe-42" });
    useAppStore.getState().setCurrentFestEventId(null);
    expect(useAppStore.getState().currentFestEventId).toBeNull();
  });
});
