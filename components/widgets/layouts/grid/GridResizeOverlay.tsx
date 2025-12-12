import { useRef, useEffect, RefObject, useMemo, useCallback } from "react";
import { MouseEvent } from "react";

import { ResizeHandleOrientation, ResizeHandleProps } from "./GridResizeHandle";

import { Grid } from "@/lib/widgets/layout";

export default function GridResizeOverlay(props: ResizeOverlayProps) {
  const { startResizing, resize, stopResizing, overlayRef } =
    useResizing(props);

  useEffect(startResizing, []);

  return (
    <div
      ref={overlayRef}
      onMouseMove={resize}
      onMouseUp={stopResizing}
      className="fixed inset-0 z-9999"
    />
  );
}

interface ResizeOverlayProps extends ResizeHandleProps {
  grid: Grid;
  orientation: ResizeHandleOrientation;
  onResizeStart?: () => unknown;
  onResize?: (move: number) => unknown;
  onResizeEnd?: (move: number) => unknown;
}

interface ResizeOverlayDependencies {
  grid: Grid;
  orientation: ResizeHandleOrientation;
  overlayRef: RefObject<HTMLDivElement | null>;
  onResizeStart: () => unknown;
  onResize: (move: number) => unknown;
  onResizeEnd: (move: number) => unknown;
  start: RefObject<Point | null>;
}

function useResizing(props: ResizeOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const start = useRef<Point>(null);

  const dependencies: ResizeOverlayDependencies = useMemo(
    () => ({
      grid: props.grid,
      overlayRef,
      onResizeStart: () => props.onResizeStart?.(),
      onResize: (move: number) => props.onResize?.(move),
      onResizeEnd: (move: number) => props.onResizeEnd?.(move),
      orientation: props.orientation,
      start,
    }),
    [props],
  );

  const startResizing = useCallback(
    () => handleResizeStart(dependencies),
    [dependencies],
  );

  const resize = useCallback(
    (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) =>
      handleResize(dependencies, event),
    [dependencies],
  );

  const stopResizing = useCallback(
    () => handleResizeStop(dependencies),
    [dependencies],
  );

  return { startResizing, resize, stopResizing, overlayRef };
}

function handleResizeStart(dependencies: ResizeOverlayDependencies) {
  document.body.style.cursor = `${dependencies.orientation == "horizontal" ? "row" : "col"}-resize`;
  dependencies.onResizeStart();
}

function handleResize(
  dependencies: ResizeOverlayDependencies,
  event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
) {
  dependencies.start.current = !dependencies.start.current
    ? { x: event.clientX, y: event.clientY }
    : dependencies.start.current;

  const move = calculateMove(dependencies, event);
  dependencies.onResize(move);
}

function calculateMove(
  dependencies: ResizeOverlayDependencies,
  event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
) {
  if (!dependencies.start.current) return 0;

  const start = dependencies.start.current;
  const currentPoint: Point = { x: event.clientX, y: event.clientY };

  if (dependencies.orientation == "horizontal")
    return Math.round(
      (currentPoint.y - start.y) / calculateRowHeight(dependencies.grid),
    );
  else
    return Math.round(
      (currentPoint.x - start.x) / calculateColumnWidth(dependencies.grid),
    );
}

function calculateRowHeight(grid: Grid) {
  return window.innerHeight / grid.rows;
}

function calculateColumnWidth(grid: Grid) {
  return window.innerWidth / grid.columns;
}

function handleResizeStop(dependencies: ResizeOverlayDependencies) {
  document.body.style.cursor = "default";
  dependencies.onResizeEnd(0);
}

interface Point {
  x: number;
  y: number;
}
