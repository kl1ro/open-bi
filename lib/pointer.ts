import type { PointerEvent } from "react";

export function takeOverPointerEvent(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
}
