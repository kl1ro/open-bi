import { useRef, CSSProperties, useState, createContext } from "react";
import { motion } from "framer-motion";

import GridResizeHandle from "./GridResizeHandle";
import GridItemResizeHighLight from "./GridItemResizeHighlight";

import Grid, {
  areAtSameRow,
  getOccupancyGrid,
  GridItem,
  takesSpace,
} from "@/lib/widgets/layouts/grid";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/state/hooks";
import { upsertWidget } from "@/state/features/dashboard";

export default function GridResizeOverlay(props: GridResizeProps) {
  const state = useGridResizeOverlayState(props);

  return (
    <ResizeContext.Provider value={state}>
      <div
        ref={state.containerRef}
        onMouseMove={(e) => resize(state, e.nativeEvent)}
        onMouseUp={() => stopResizing(state)}
        className={cn(
          "absolute inset-0 grid gap-8 grid-rows-(--rows) grid-cols-(--cols) pointer-events-none overflow-visible",
          state.selected && "pointer-events-auto",
        )}
        style={
          {
            "--rows": `repeat(${state.grid.rows}, minmax(0, 1fr))`,
            "--cols": `repeat(${state.grid.columns}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        {state.grid.children
          ?.filter((widget) => takesSpace(widget))
          .map((widget) => (
            <motion.div
              key={widget.id}
              layout
              className="relative row-start-(--row-start) col-start-(--col-start) row-span-(--row-span) col-span-(--col-span)"
              style={
                {
                  "--row-span": widget.size.rowSpan,
                  "--col-span": widget.size.colSpan,
                  "--row-start": widget.position.row,
                  "--col-start": widget.position.column,
                } as CSSProperties
              }
            >
              {widget.position.column + widget.size.colSpan - 1 <
                state.grid.columns && (
                <GridResizeHandle
                  orientation="vertical"
                  onMouseDown={() =>
                    startResizing(
                      state,
                      getHorizontalNeighbors(widget, state.grid),
                    )
                  }
                />
              )}

              {widget.position.row + widget.size.rowSpan - 1 <
                state.grid.rows && (
                <GridResizeHandle
                  orientation="horizontal"
                  onMouseDown={() =>
                    startResizing(
                      state,
                      getVerticalNeighbors(widget, state.grid),
                    )
                  }
                />
              )}

              <GridItemResizeHighLight item={widget} />
            </motion.div>
          ))}
      </div>
    </ResizeContext.Provider>
  );
}

interface GridResizeProps {
  grid: Grid;
}

export function useGridResizeOverlayState(props: GridResizeProps) {
  const dispatch = useAppDispatch();

  const [move, setMove] = useState(0);
  const [selected, setSelected] = useState<[GridItem, GridItem]>();
  const containerRef = useRef<HTMLDivElement>(null);

  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const orientation = useRef<"row" | "column" | null>(null);

  return {
    ...props,
    dispatch,
    containerRef,
    move,
    setMove,
    selected,
    setSelected,
    startPoint,
    orientation,
  };
}

function startResizing(
  state: ReturnType<typeof useGridResizeOverlayState>,
  neighbors: [GridItem, GridItem],
) {
  state.setSelected(neighbors);
  state.setMove(0);

  state.startPoint.current = null;
  state.orientation.current = areAtSameRow(...neighbors) ? "row" : "column";

  document.body.style.cursor =
    state.orientation.current === "column" ? "row-resize" : "col-resize";
}

function resize(
  state: ReturnType<typeof useGridResizeOverlayState>,
  event: MouseEvent,
) {
  if (!state.containerRef.current || !state.orientation.current) return;

  if (!state.startPoint.current) {
    state.startPoint.current = { x: event.clientX, y: event.clientY };
    return;
  }

  const { x, y } = state.startPoint.current;
  const dx = event.clientX - x;
  const dy = event.clientY - y;

  const gridElement = state.containerRef.current;

  let nextMove = 0;

  if (state.orientation.current === "column") {
    const rowHeight = gridElement.clientHeight / state.grid.rows;
    nextMove = Math.round(dy / rowHeight);
  } else {
    const colWidth = gridElement.clientWidth / state.grid.columns;
    nextMove = Math.round(dx / colWidth);
  }

  state.setMove(nextMove);
}

function stopResizing(state: ReturnType<typeof useGridResizeOverlayState>) {
  updateWidget(state);
  resetResize(state);
}

function resetResize(state: ReturnType<typeof useGridResizeOverlayState>) {
  document.body.style.cursor = "default";
  state.startPoint.current = null;
  state.orientation.current = null;
  state.setSelected(undefined);
  setTimeout(() => state.setMove(0), 100);
}

function updateWidget(state: ReturnType<typeof useGridResizeOverlayState>) {
  if (!state.selected || !state.move || !state.orientation.current) return;
  const grid = getResizedGrid(state);
  state.dispatch(upsertWidget(grid));
}

function getResizedGrid(
  state: ReturnType<typeof useGridResizeOverlayState>,
): Grid {
  const [[resizePosKey, resizeSpanKey], [depthPosKey, depthSpanKey]] =
    state.orientation.current == "row"
      ? ([
          ["column", "colSpan"],
          ["row", "rowSpan"],
        ] as const)
      : ([
          ["row", "rowSpan"],
          ["column", "colSpan"],
        ] as const);

  const [left, right] = structuredClone(state.selected!);

  const sweepStart = right.position[resizePosKey] - (state.move > 0 ? 0 : 1);
  const sweepEnd = sweepStart + state.move;
  const delta = Math.abs(state.move);

  const grid = structuredClone(state.grid);
  const occupancyGrid = getOccupancyGrid(grid);

  let expanded = state.move > 0 ? left : right;
  expanded = grid.children!.find((item) => item.id === expanded.id) as GridItem;
  expanded.size[resizeSpanKey] += delta;
  if (state.move < 0) expanded.position[resizePosKey] -= delta;

  for (
    let i = sweepStart;
    state.move > 0 ? i < sweepEnd : i > sweepEnd;
    state.move > 0 ? i++ : i--
  ) {
    for (
      let j = expanded.position[depthPosKey];
      j < expanded.position[depthPosKey] + expanded.size[depthSpanKey];
      j++
    ) {
      let current = (
        resizePosKey == "row" ? occupancyGrid[j][i] : occupancyGrid[i][j]
      ) as GridItem;

      current = grid.children!.find(
        (item) => item.id === current?.id,
      ) as GridItem;

      if (current.size[resizeSpanKey] == 1)
        grid.children = grid.children?.filter(
          (child) => child.id !== current.id,
        );
      else {
        current.size[resizeSpanKey] -= 1;
        if (state.move > 0) current.position[resizePosKey] += 1;
      }
    }
  }

  return grid;
}

function getVerticalNeighbors(
  widget: GridItem,
  grid: Grid,
): [GridItem, GridItem] {
  return [
    widget,
    grid.children?.find((item) => {
      return (
        item.position.column === widget.position.column &&
        item.position.row === widget.position.row + widget.size.rowSpan
      );
    }) as GridItem,
  ];
}

function getHorizontalNeighbors(
  widget: GridItem,
  grid: Grid,
): [GridItem, GridItem] {
  return [
    widget,
    grid.children?.find((item) => {
      return (
        item.position.row === widget.position.row &&
        item.position.column === widget.position.column + widget.size.colSpan
      );
    }) as GridItem,
  ];
}

export const ResizeContext = createContext<ReturnType<
  typeof useGridResizeOverlayState
> | null>(null);
