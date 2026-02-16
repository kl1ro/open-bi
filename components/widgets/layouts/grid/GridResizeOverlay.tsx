import { useRef, CSSProperties, useState, createContext } from "react";

import GridResizeHandle from "./GridResizeHandle";
import GridItemResizeHighLight from "./GridItemResizeHighlight";

import Grid, {
  areAtSameRow,
  GridItem,
  takesSpace,
} from "@/lib/widgets/layouts/grid";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/state/hooks";
import { upsertWidget } from "@/state/features/widget";

export default function GridResizeOverlay(props: GridResizeProps) {
  const state = useGridResizeOverlayState(props);

  return (
    <ResizeContext.Provider value={state}>
      <div
        ref={state.containerRef}
        onMouseMove={(e) => resize(state, e.nativeEvent)}
        onMouseUp={() => stopResizing(state)}
        className={cn(
          "p-2 absolute inset-0 grid gap-8 grid-rows-(--rows) grid-cols-(--cols) pointer-events-none",
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
          ?.filter((w) => takesSpace(w))
          .map((widget, i) => (
            <div
              key={i}
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
              {widget.position.column < state.grid.columns && (
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

              {widget.position.row < state.grid.rows && (
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
            </div>
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
  state.orientation.current = areAtSameRow(...neighbors) ? "column" : "row";

  document.body.style.cursor =
    state.orientation.current === "column" ? "col-resize" : "row-resize";
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

  if (state.orientation.current === "row") {
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
  if (!state.selected) return;

  const expanded = getExpandedElement(state);
  const shrunk = getShrunkElements(state);

  setTimeout(() => {
    state.dispatch(upsertWidget(expanded));
    shrunk.forEach((widget) => state.dispatch(upsertWidget(widget)));
  }, 200);
}

function getExpandedElement(
  state: ReturnType<typeof useGridResizeOverlayState>,
) {
  const expanded = structuredClone(
    state.move < 0 ? state.selected![1] : state.selected![0],
  );

  expanded.size[state.orientation.current == "row" ? "rowSpan" : "colSpan"] +=
    Math.abs(state.move);

  if (state.move < 0)
    expanded.position[state.orientation.current == "row" ? "row" : "column"] +=
      state.move;

  return expanded;
}

function getShrunkElements(
  state: ReturnType<typeof useGridResizeOverlayState>,
): GridItem[] {
  const { grid, selected, move, orientation } = state;
  if (!selected || !orientation.current || !move) return [];

  const axis = orientation.current === "row" ? "row" : "column";
  const spanKey = axis === "row" ? "rowSpan" : "colSpan";

  const [first, second] = selected;
  const expanded = move < 0 ? second : first;

  const delta = Math.abs(move);

  const sweepStart =
    move > 0
      ? expanded.position[axis] + expanded.size[spanKey]
      : expanded.position[axis] + delta;

  const sweepEnd = sweepStart + delta;

  const shrunk: Record<`${number},${number}`, GridItem> = {};

  for (let i = sweepStart; i < sweepEnd; i++) {
    const key: `${number},${number}` =
      axis == "column"
        ? `${i},${expanded.position.row}`
        : `${expanded.position.column},${i}`;

    const widget = structuredClone(grid.childrenMap![key]);

    if (state.move > 0) {
      if (widget.size[spanKey] > 1) {
        const previousKey: `${number},${number}` =
          axis == "column"
            ? `${i - 1},${expanded.position.row}`
            : `${expanded.position.column},${i - 1}`;

        delete shrunk[previousKey];
      }

      if (widget.size[spanKey] > 1) widget.position[axis] += 1;
      widget.size[spanKey] -= 1;
    } else widget.size[spanKey] -= 1;

    shrunk[key] = widget;
  }

  return Object.values(shrunk);
}

function getVerticalNeighbors(
  widget: GridItem,
  grid: Grid,
): [GridItem, GridItem] {
  return [
    widget,
    grid.childrenMap![`${widget.position.column},${widget.position.row + 1}`],
  ];
}

function getHorizontalNeighbors(
  widget: GridItem,
  grid: Grid,
): [GridItem, GridItem] {
  return [
    widget,
    grid.childrenMap![`${widget.position.column + 1},${widget.position.row}`],
  ];
}

export const ResizeContext = createContext<ReturnType<
  typeof useGridResizeOverlayState
> | null>(null);
