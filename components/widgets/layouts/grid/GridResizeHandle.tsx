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
      setOverlayShown,
      neighbors: props.neighbors,
    }),
    [props],
  );

  const start = useCallback(() => startResizing(dependencies), [dependencies]);
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
          onResizeStart={() => start()}
          onResize={() => resize()}
          onResizeEnd={() => stop()}
          {...{ ...props, handleRef }}
        />
      )}
    </>
  );
}

export interface ResizeHandleProps {
  orientation: "vertical" | "horizontal";
  grid: Grid;
  position: WidgetPosition;
  neighbors: number[];
  setSelected: Dispatch<SetStateAction<number[]>>;
}

interface ResizeHandleDependencies {
  setSelected: Dispatch<SetStateAction<number[]>>;
  setOverlayShown: Dispatch<SetStateAction<boolean>>;
  neighbors: number[];
}

function startResizing(dependencies: ResizeHandleDependencies) {
  dependencies.setSelected(dependencies.neighbors);
}

function resize() {}

function stopResizing(dependencies: ResizeHandleDependencies) {
  dependencies.setSelected([]);
  dependencies.setOverlayShown(false);
}
