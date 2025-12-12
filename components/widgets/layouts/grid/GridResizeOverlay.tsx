import { useRef, useEffect, RefObject } from "react";
import { MouseEvent } from "react";

import { ResizeHandleProps } from "./GridResizeHandle";

export default function GridResizeOverlay(props: ResizeOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const dependencies: ResizeOverlayDependencies = {
    overlayRef,
    handleRef: props.handleRef,
    onResizeStart: () => props.onResizeStart?.(),
    onResize: (move: number) => props.onResize?.(move),
    onResizeEnd: (move: number) => props.onResizeEnd?.(move),
  };

  useEffect(() => startResizing(dependencies), []);

  return (
    <div
      ref={overlayRef}
      onMouseMove={(event) => resize(dependencies, event)}
      onMouseUp={() => stopResizing(dependencies)}
      className="fixed inset-0 z-9999"
    />
  );
}

interface ResizeOverlayProps extends ResizeHandleProps {
  handleRef: RefObject<HTMLDivElement | null>;
  onResizeStart?: () => unknown;
  onResize?: (move: number) => unknown;
  onResizeEnd?: (move: number) => unknown;
}

interface ResizeOverlayDependencies {
  handleRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  onResizeStart: () => unknown;
  onResize: (move: number) => unknown;
  onResizeEnd: (move: number) => unknown;
}

function startResizing(dependencies: ResizeOverlayDependencies) {
  document.body.style.cursor = "col-resize";
  dependencies.onResizeStart();
}

function resize(
  dependencies: ResizeOverlayDependencies,
  event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
) {
  console.log(event.clientX);
}

function stopResizing(dependencies: ResizeOverlayDependencies) {
  document.body.style.cursor = "default";
  dependencies.onResizeEnd(0);
}
