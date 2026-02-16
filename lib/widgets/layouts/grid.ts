import { v4 as uuid } from "uuid";

import { AbstractLayout } from "../layout";

import Widget from "@/lib/widget";

export default interface Grid extends AbstractLayout {
  layout: "grid";
  rows: number;
  columns: number;
  children?: GridItem[];
  childrenMap?: Record<`${number},${number}`, GridItem>;
}

export function generateGridMap(
  grid: Grid,
): Record<`${number},${number}`, GridItem> {
  const map: Record<`${number},${number}`, GridItem> = {};

  grid.children?.forEach((widget) => {
    map[`${widget.position.column},${widget.position.row}`] = widget;
  });

  return map;
}

export function fillGridWithVoids(grid: Grid): Grid {
  const occupied = getOccupancyGrid(grid);
  grid.children = grid.children ?? [];

  for (let c = 0; c < grid.columns; c++) {
    for (let r = 0; r < grid.rows; r++) {
      if (!occupied[c][r]) {
        grid.children.push({
          id: uuid(),
          type: "void",
          position: { column: c + 1, row: r + 1 },
          size: { colSpan: 1, rowSpan: 1 },
          parent: { ...grid, children: undefined },
        } as GridItem);
      }
    }
  }

  return grid;
}

export function getOccupancyGrid(grid: Grid): boolean[][] {
  const occupancyGrid: boolean[][] = Array.from({ length: grid.columns }).map(
    () => Array.from({ length: grid.rows }).map(() => false),
  );

  grid.children?.forEach((widget) => {
    const startRow = widget.position.row - 1;
    const startCol = widget.position.column - 1;
    const rowSpan = widget.size.rowSpan;
    const colSpan = widget.size.colSpan;

    for (let c = startCol; c < startCol + colSpan; c++) {
      for (let r = startRow; r < startRow + rowSpan; r++) {
        if (r >= 0 && r < grid.rows && c >= 0 && c < grid.columns) {
          occupancyGrid[c][r] = true;
        }
      }
    }
  });

  return occupancyGrid;
}

export function areAtSamePosition(i1?: GridItem, i2?: GridItem): boolean {
  if (!i1?.position || !i2?.position) return false;

  return (
    i1.position.row === i2.position.row &&
    i1.position.column === i2.position.column
  );
}

export function areAtSameRow(i1?: GridItem, i2?: GridItem): boolean {
  if (!i1?.position || !i2?.position) return false;
  return i1.position.row === i2.position.row;
}

export function areAtSameColumn(i1?: GridItem, i2?: GridItem): boolean {
  if (!i1?.position || !i2?.position) return false;
  return i1.position.column === i2.position.column;
}

export function takesSpace(widget: GridItem): boolean {
  return widget.size.colSpan > 0 && widget.size.rowSpan > 0;
}

export const SPACING_OPTIONS = ["1", "2", "3", "4", "5", "6", "8", "9", "12"];

export type GridItem = Widget & {
  parent: Grid;
  position: GridItemPosition;
  size: GridItemSize;
};

export interface GridItemPosition {
  row: number;
  column: number;
}

export interface GridItemSize {
  rowSpan: number;
  colSpan: number;
}

export const DEFAULT_WIDGET_POSITION = {
  row: 0,
  column: 0,
};
