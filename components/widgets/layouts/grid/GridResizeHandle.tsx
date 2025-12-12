import {
  useState,
  useRef,
  Dispatch,
  SetStateAction,
  useMemo,
  useCallback,
} from "react";

import GridResizeOverlay from "./GridResizeOverlay";

import { Grid } from "@/lib/widgets/layout";
import { WidgetPosition } from "@/lib/widgets/widget";
import { cn } from "@/lib/utils";

export default function GridResizeHandle(props: ResizeHandleProps) {
  const [overlayShown, setOverlayShown] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const dependencies: ResizeHandleDependencies = useMemo(
    () => ({
      setSelected: props.setSelected,
      setResize: props.setResize,
      setOverlayShown,
      neighbors: props.neighbors,
      orientation: props.orientation,
    }),
    [props, setOverlayShown],
  );

  const start = useCallback(() => startResizing(dependencies), [dependencies]);

  const resize = useCallback(
    (move: number) => handleResize(dependencies, move),
    [dependencies],
  );

  const stop = useCallback(() => stopResizing(dependencies), [dependencies]);

  return (
    <>
      <div
        className={`group ${props.orientation == "vertical" ? "h-full w-1.5 cursor-col-resize flex items-center" : "w-full h-1.5 cursor-row-resize flex justify-center"}`}
        onMouseDown={() => setOverlayShown(true)}
        style={{
          gridColumnStart: props.position.column,
          gridRowStart: props.position.row,
        }}
        ref={handleRef}
      >
        <div
          className={cn(
            "group-hover:bg-blue-700 bg-medium animated rounded-xs",
            `${overlayShown ? "bg-blue-700" : ""}`,
            `${props.orientation == "vertical" ? "h-2/5 w-full" : "w-3/5 h-full"}`,
          )}
        />
      </div>

      {overlayShown && (
        <GridResizeOverlay
          onResizeStart={start}
          onResize={resize}
          onResizeEnd={stop}
          {...props}
        />
      )}
    </>
  );
}

export interface ResizeHandleProps {
  orientation: ResizeHandleOrientation;
  grid: Grid;
  position: WidgetPosition;
  neighbors: number[];
  setSelected: Dispatch<SetStateAction<number[]>>;
  setResize: Dispatch<SetStateAction<number | undefined>>;
}

export type ResizeHandleOrientation = "horizontal" | "vertical";

interface ResizeHandleDependencies {
  orientation: ResizeHandleOrientation;
  setSelected: Dispatch<SetStateAction<number[]>>;
  setResize: Dispatch<SetStateAction<number | undefined>>;
  setOverlayShown: Dispatch<SetStateAction<boolean>>;
  neighbors: number[];
}

function startResizing(dependencies: ResizeHandleDependencies) {
  dependencies.setSelected(dependencies.neighbors);
}

function handleResize(dependencies: ResizeHandleDependencies, move: number) {
  dependencies.setResize(move);
}

function stopResizing(dependencies: ResizeHandleDependencies) {
  dependencies.setSelected([]);
  dependencies.setOverlayShown(false);
}
