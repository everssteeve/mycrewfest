export function nextPinState(current: boolean): boolean {
  return !current;
}

export function nextUrgencyLevel(current: string): "normal" | "critique" {
  return current === "critique" ? "normal" : "critique";
}
