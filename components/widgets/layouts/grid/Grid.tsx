import { Fragment, useMemo, useState } from "react";

import WidgetComponent from "../../../Widget";
import GridResizeHandle from "./GridResizeHandle";

import Layout, { type Grid } from "@/lib/widgets/layout";
import Widget from "@/lib/widgets/widget";
import Void from "@/lib/widgets/void";

export default function Grid(props: Grid) {
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
              position={{
                row: Math.floor(i / props.columns) * 2 + 1,
                column: (i % props.columns) * 2,
              }}
            />
          )) || <></>}
          <WidgetComponent {...widget} selected={selected.includes(i)} />
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
