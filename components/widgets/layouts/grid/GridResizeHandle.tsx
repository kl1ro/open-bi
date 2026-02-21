import { useContext, useEffect, useState } from "react";

import { ResizeContext } from "./GridResizeOverlay";

import { cn } from "@/lib/utils";

export default function GridResizeHandle(props: ResizeHandleProps) {
  const state = useGridResizeHandleState(props);

  useEffect(() => {
    if (!state.resize?.selected) state.setIsDown(false);
  }, [state.resize?.selected]);

  return (
    <>
      <div
        className={cn(
          "absolute pointer-events-auto group",
          state.orientation == "vertical"
            ? "top-0 -right-4.5 h-full w-1.5 cursor-col-resize flex items-center"
            : "-bottom-4.5 w-full h-1.5 cursor-row-resize flex justify-center",
          state.resize?.selected && "pointer-events-none",
        )}
        onMouseDown={() => handleMouseDown(state)}
      >
        <div
          className={cn(
            "group-hover:bg-blue-700 bg-medium animated rounded-xs",
            `${state.resize?.selected && state.isDown ? "bg-blue-700" : ""}`,
            `${state.orientation == "vertical" ? "h-2/5 w-full" : "w-3/5 h-full"}`,
          )}
        />
      </div>
    </>
  );
}

export function useGridResizeHandleState(
  props: Parameters<typeof GridResizeHandle>[0],
) {
  const resize = useContext(ResizeContext);
  const [isDown, setIsDown] = useState(false);

  return {
    ...props,
    resize,
    isDown,
    setIsDown,
  };
}

function handleMouseDown(state: ReturnType<typeof useGridResizeHandleState>) {
  state.setIsDown(true);
  state.onMouseDown();
}

export interface ResizeHandleProps {
  orientation: ResizeHandleOrientation;
  onMouseDown: () => unknown;
}

export type ResizeHandleOrientation = "horizontal" | "vertical";
