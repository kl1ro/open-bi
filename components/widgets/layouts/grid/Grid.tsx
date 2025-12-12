import { Fragment, useMemo, useState } from "react";

import WidgetComponent, { HighlightProps } from "../../../Widget";
import GridResizeHandle from "./GridResizeHandle";

import Layout, { type Grid } from "@/lib/widgets/layout";
import Widget from "@/lib/widgets/widget";
import Void from "@/lib/widgets/void";

export default function Grid(props: Grid) {
  const [resize, setResize] = useState<number>();
  const [selected, setSelected] = useState<number[]>([]);
  const widgets = useMemo(() => getWidgets(props), [props]);

  return (
    <div
      className="w-full h-full grid gap-4"
      style={{
        gridTemplateRows: calculateGridTemplate(props.rows),
        gridTemplateColumns: calculateGridTemplate(props.columns),
      }}
    >
      {widgets.map((widget, i) => (
        <Fragment key={i}>
          {i && i % props.columns == 0 ? (
            Array.from({ length: props.columns }).map((_, j) => (
              <GridResizeHandle
                key={j}
                orientation="horizontal"
                grid={props}
                neighbors={[i - props.columns + j, i + j]}
                setSelected={setSelected}
                setResize={setResize}
                position={{
                  row: Math.floor(i / props.columns) * 2,
                  column: j * 2 + 1,
                }}
              />
            ))
          ) : (
            <></>
          )}

          {(i % props.columns != 0 && (
            <GridResizeHandle
              orientation="vertical"
              grid={props}
              neighbors={[i - 1, i]}
              setSelected={setSelected}
              setResize={setResize}
              position={{
                row: Math.floor(i / props.columns) * 2 + 1,
                column: (i % props.columns) * 2,
              }}
            />
          )) || <></>}

          <WidgetComponent
            {...widget}
            highlight={calculateHighlight({ i, props, resize, selected })}
          />
        </Fragment>
      ))}
    </div>
  );
}

function calculateGridTemplate(n: number) {
  return Array.from({ length: n * 2 - 1 }, (_, i) =>
    (i + 1) % 2 === 0 ? "auto" : "1fr",
  ).join(" ");
}

function getWidgets(grid: Grid): Widget[] {
  const map = getWidgetsMap(grid.children);
  const widgets: Widget[] = [];
  fillWidgetsWithVoids(widgets, map, grid);
  return widgets;
}

function getWidgetsMap(widgets: Widget[]): Map<`${number}-${number}`, Widget> {
  return new Map(
    widgets.map((widget) => [
      `${widget.position.row}-${widget.position.column}`,
      widget,
    ]),
  );
}

function fillWidgetsWithVoids(
  widgets: Widget[],
  map: Map<`${number}-${number}`, Widget>,
  grid: Grid,
) {
  for (let i = 1; i <= grid.rows * 2; i += 2) {
    for (let j = 1; j <= grid.columns * 2; j += 2) {
      const existing = map.get(`${i}-${j}`);

      if (existing) widgets.push(existing);
      else {
        if (intersectCellWidget(grid.children, i, j)) continue;
        widgets.push(getVoid(i, j, grid));
      }
    }
  }
}

function intersectCellWidget(widgets: Widget[], i: number, j: number) {
  return widgets.find(
    (widget) => widget.position.row == i && widget.position.column == j,
  );
}

function getVoid(i: number, j: number, parent: Layout): Void {
  return {
    position: { row: i, column: j },
    size: { rowSpan: 1, colSpan: 1 },
    parent,
  };
}

function calculateHighlight(params: HightlightParams) {
  const { i, props, selected } = params;

  const isSelected = selected.includes(i);
  const isAvailiable = isAvailableToResize(i, selected, props);

  if (!isSelected && !isAvailiable) return;

  const highlight: HighlightProps = {
    active: true,
    "--tw-ring-color": isSelected
      ? "var(--color-blue-700)"
      : "var(--color-blue-950)",
    ...(() => calculateHighlightPosition(params))(),
  };

  return highlight;
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

  const position: HighlightProps = {};

  if (resizingRow) {
    if (resize > 0 && !selectedIndex) {
      position.width = `calc(100% + (100% + 2.375rem) * ${resize})`;
      position.right = "auto";
      position.left = 0;
      position.zIndex = 30;
    } else if (resize < 0 && selectedIndex) {
      position.width = `calc(100% + (100% + 2.375rem) * ${Math.abs(resize)})`;
      position.left = "auto";
      position.right = 0;
      position.zIndex = 30;
    } else return { "--tw-ring-color": "var(--color-blue-950)" };
  } else {
    if (resize > 0 && !selectedIndex) {
      position.height = `calc(100% + (100% + 2.375rem) * ${resize})`;
      position.bottom = "auto";
      position.top = 0;
      position.zIndex = 30;
    } else if (resize < 0 && selectedIndex) {
      position.height = `calc(100% + (100% + 2.375rem) * ${Math.abs(resize)})`;
      position.top = "auto";
      position.bottom = 0;
      position.zIndex = 30;
    } else return { "--tw-ring-color": "var(--color-blue-950)" };
  }

  console.log(position);

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
