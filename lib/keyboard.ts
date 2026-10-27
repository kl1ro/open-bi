export function isSaveEvent(e: KeyboardEvent) {
  return e.code === "KeyS" && e.ctrlKey;
}
