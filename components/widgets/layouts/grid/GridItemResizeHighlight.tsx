import { CSSProperties, useContext, useMemo } from "react";

import { ResizeContext } from "./GridResizeOverlay";

import { cn } from "@/lib/utils";
import {
  areAtSameColumn,
  areAtSamePosition,
  areAtSameRow,
  GridItem,
} from "@/lib/widgets/layouts/grid";

interface GridItemResizeHighlightProps {
  item: GridItem;
}

export default function GridItemResizeHighlight(
  props: GridItemResizeHighlightProps,
) {
  const state = useGridItemResizeHighlightState(props);
  const styleFallback = useMemo(
    () => calculateHighlightPosition(state),
    [state.resize?.move],
  );

  return (
    <div
      style={styleFallback}
      className={cn(
        "absolute inset-0 z-20 h-full w-full rounded-xl pointer-events-none animated",
        (state.focused || state.available) && "ring-2 ring-inset",
        state.focused ? "ring-blue-700" : state.available && "ring-blue-950",
      )}
    />
  );
}

function useGridItemResizeHighlightState(
  props: Parameters<typeof GridItemResizeHighlight>[0],
) {
  const resize = useContext(ResizeContext);

  const focused =
    areAtSamePosition(props.item, resize?.selected?.[0]) ||
    areAtSamePosition(props.item, resize?.selected?.[1]);

  const available =
    (resize?.orientation.current == "row" &&
      areAtSameRow(props.item, resize?.selected?.[0])) ||
    (resize?.orientation.current == "column" &&
      areAtSameColumn(props.item, resize?.selected?.[0]));

  return {
    ...props,
    resize,
    focused,
    available,
  };
}

export function calculateHighlightPosition(
  state: ReturnType<typeof useGridItemResizeHighlightState>,
): CSSProperties {
  if (
    !state.resize?.selected?.some((item) => areAtSamePosition(state.item, item))
  )
    return {};

  const selectedIndex =
    state.resize?.selected?.findIndex((item) =>
      areAtSamePosition(state.item, item),
    ) ?? -1;

  const resizingRow = areAtSameRow(...(state.resize?.selected ?? []));
  const move = state.resize?.move ?? 0;

  if (!move) {
    if (resizingRow) {
      return selectedIndex === 0
        ? { left: 0, right: "auto" }
        : { right: 0, left: "auto" };
    }

    return selectedIndex === 0
      ? { top: 0, bottom: "auto" }
      : { bottom: 0, top: "auto" };
  }

  const style: CSSProperties = { zIndex: 30 };
  const containerRect =
    state.resize.containerRef.current?.getBoundingClientRect();

  const itemSize = Math.round(
    state.resize.orientation.current == "row"
      ? (containerRect?.width ?? 0) / state.resize.grid.columns
      : (containerRect?.height ?? 0) / state.resize.grid.rows,
  );

  const grow = `calc(100% + (${itemSize}px + 0.5rem) * ${Math.abs(move)})`;

  if (resizingRow) {
    if (move > 0 && selectedIndex === 0) {
      style.width = grow;
      style.left = 0;
      style.right = "auto";
    } else if (move < 0 && selectedIndex === 1) {
      style.width = grow;
      style.right = 0;
      style.left = "auto";
    } else {
      return {
        "--tw-ring-color": "var(--color-blue-950)",
        zIndex: 20,
      } as CSSProperties;
    }
  } else {
    if (move > 0 && selectedIndex === 0) {
      style.height = grow;
      style.top = 0;
      style.bottom = "auto";
    } else if (move < 0 && selectedIndex === 1) {
      style.height = grow;
      style.bottom = 0;
      style.top = "auto";
    } else {
      return {
        "--tw-ring-color": "var(--color-blue-950)",
        zIndex: 20,
      } as CSSProperties;
    }
  }

  return style;
}
