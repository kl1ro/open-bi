import { CSSProperties, useRef, useState } from "react";

import WidgetComponent from "../../../Widget";

import type Grid from "@/lib/widgets/layouts/grid";
import Widget, { WidgetPosition } from "@/lib/widget";
import { useAppDispatch } from "@/state/hooks";
import { upsertWidget } from "@/state/features/widget";

export default function Grid(props: Grid) {
  const state = useGridState(props);

  return (
    <div
      className="w-full h-full grid gap-4 grid-rows-(--rows) grid-cols-(--cols)"
      style={
        {
          "--rows": `repeat(${props.rows}, minmax(0, 1fr))`,
          "--cols": `repeat(${props.columns}, minmax(0, 1fr))`,
        } as CSSProperties
      }
    >
      {props.children?.map((widget, i) => (
        <div
          style={
            {
              "--row-span": `span ${widget.size.rowSpan} / span ${widget.size.rowSpan}`,
              "--col-span": `span ${widget.size.colSpan} / span ${widget.size.colSpan}`,
            } as CSSProperties
          }
          key={i}
          className="row-span-(--row-span) col-span-(--col-span)"
        >
          <WidgetComponent {...widget} />
        </div>
      ))}
    </div>
  );
}

function useGridState(props: Parameters<typeof Grid>[0]) {
  const dispatch = useAppDispatch();
  const [resize, setResize] = useState<number>();
  const [selected, setSelected] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  return {
    props,
    dispatch,
    resize,
    setResize,
    selected,
    setSelected,
    ref,
  };
}

function calculateHighlightPosition(params: HightlightParams) {
  const { i, props, resize, selected } = params;
  if (!selected.includes(i)) return {};

  const selectedIndex = selected.indexOf(i);
  const resizingRow = areResizingRow(selected, props);

  if (!resize) {
    if (resizingRow) {
      if (!selectedIndex)
        return {
          left: 0,
          right: "auto",
        };
      else
        return {
          right: 0,
          left: "auto",
        };
    } else {
      if (!selectedIndex)
        return {
          top: 0,
          bottom: "auto",
        };
      else
        return {
          bottom: 0,
          top: "auto",
        };
    }
  }

  const position: HighlightProps = { zIndex: 30 };

  if (resizingRow) {
    if (resize > 0 && !selectedIndex) {
      position.width = `calc(100% + (100% + 2.375rem) * ${resize})`;
      position.right = "auto";
      position.left = 0;
    } else if (resize < 0 && selectedIndex) {
      position.width = `calc(100% + (100% + 2.375rem) * ${Math.abs(resize)})`;
      position.left = "auto";
      position.right = 0;
    } else return { "--tw-ring-color": "var(--color-blue-950)", zIndex: 20 };
  } else {
    if (resize > 0 && !selectedIndex) {
      position.height = `calc(100% + (100% + 2.375rem) * ${resize})`;
      position.bottom = "auto";
      position.top = 0;
    } else if (resize < 0 && selectedIndex) {
      position.height = `calc(100% + (100% + 2.375rem) * ${Math.abs(resize)})`;
      position.top = "auto";
      position.bottom = 0;
    } else return { "--tw-ring-color": "var(--color-blue-950)", zIndex: 20 };
  }

  return position;
}

interface HightlightParams {
  i: number;
  props: Grid;
  resize?: number;
  selected: number[];
}

function isAvailableToResize(i: number, selected: number[], grid: Grid) {
  return (
    (areResizingRow(selected, grid) && areInSameRow(selected[0], i, grid)) ||
    (areResizingColumn(selected, grid) && areInSameColumn(selected[0], i, grid))
  );
}

function areResizingRow(selected: number[], grid: Grid) {
  return areInSameRow(selected[0], selected[1], grid);
}

function areResizingColumn(selected: number[], grid: Grid) {
  return areInSameColumn(selected[0], selected[1], grid);
}

function areInSameRow(i1: number, i2: number, grid: Grid) {
  return Math.floor(i1 / grid.columns) == Math.floor(i2 / grid.columns);
}

function areInSameColumn(i1: number, i2: number, grid: Grid) {
  return i1 % grid.columns == i2 % grid.columns;
}

function applyResize(
  state: ReturnType<typeof useGridState>,
  handlePosition: WidgetPosition,
) {
  if (state.resize) {
    handlePosition.column = handlePosition.column + (state.resize > 0 ? -1 : 1);
    const resizable = findWidgetInGrid(handlePosition, state.props) as Widget;
    resizable.size.colSpan += state.resize;
    state.dispatch(upsertWidget(resizable));
  }

  state.setResize(0);
  state.setSelected([]);
}

function findWidgetInGrid(
  position: WidgetPosition,
  grid: Grid,
): Widget | undefined {
  const widget = grid.children?.find(
    (widget) =>
      widget.position.row == position.row &&
      widget.position.column == position.column,
  );

  return widget && { ...widget, size: { ...widget.size } };
}
