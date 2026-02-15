import { useState, useRef } from "react";

import GridResizeOverlay from "./GridResizeOverlay";

import { WidgetPosition } from "@/lib/widget";
import { cn } from "@/lib/utils";

export default function GridResizeHandle(props: ResizeHandleProps) {
  const state = useGridResizeHandleState(props);

  return (
    <>
      <div
        className={`group ${props.orientation == "vertical" ? "h-full w-1.5 cursor-col-resize flex items-center" : "w-full h-1.5 cursor-row-resize flex justify-center"}`}
        onMouseDown={() => state.setOverlayShown(true)}
        style={{
          gridColumnStart: props.position.column,
          gridRowStart: props.position.row,
        }}
        ref={state.handleRef}
      >
        <div
          className={cn(
            "group-hover:bg-blue-700 bg-medium animated rounded-xs",
            `${state.overlayShown ? "bg-blue-700" : ""}`,
            `${props.orientation == "vertical" ? "h-2/5 w-full" : "w-3/5 h-full"}`,
          )}
        />
      </div>

      {state.overlayShown && (
        <GridResizeOverlay
          onResizeStart={() => startResizing(state)}
          onResize={() => resize(state)}
          onResizeEnd={() => stopResizing(state)}
          {...props}
        />
      )}
    </>
  );
}

export function useGridResizeHandleState(
  props: Parameters<typeof GridResizeHandle>[0],
) {
  const [overlayShown, setOverlayShown] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  return {
    ...props,
    overlayShown,
    setOverlayShown,
    handleRef,
  };
}

export interface ResizeHandleProps {
  orientation: ResizeHandleOrientation;
  position: WidgetPosition;
  neighbors: number[];
}

export type ResizeHandleOrientation = "horizontal" | "vertical";

function startResizing(state: ReturnType<typeof useGridResizeHandleState>) {
  state.setSelected(state.neighbors);
}

function resize(
  state: ReturnType<typeof useGridResizeHandleState>,
  move: number,
) {
  state.setResize(move);
}

function stopResizing(state: ReturnType<typeof useGridResizeHandleState>) {
  state.setOverlayShown(false);
  state.onResizeEnd?.(state.position);
}
