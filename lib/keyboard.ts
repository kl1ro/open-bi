export function isSaveEvent(e: KeyboardEvent) {
  if (e.code == "KeyS" && e.ctrlKey) return true;
  return false;
}
