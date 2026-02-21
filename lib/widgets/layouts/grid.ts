import { v4 as uuid } from "uuid";

import { AbstractLayout } from "../layout";

import Widget from "@/lib/widget";

export default interface Grid extends AbstractLayout {
  layout: "grid";
  rows: number;
  columns: number;
  children?: GridItem[];
}

export function fillGridWithVoids(grid: Grid): Grid {
  const occupied = getOccupancyGrid(grid);
  grid.children = grid.children ?? [];

  for (let c = 1; c <= grid.columns; c++) {
    for (let r = 1; r <= grid.rows; r++) {
      if (!occupied[c][r]) {
        grid.children.push({
          id: uuid(),
          type: "void",
          position: { column: c, row: r },
          size: { colSpan: 1, rowSpan: 1 },
          parent: { ...grid, children: undefined },
        } as GridItem);
      }
    }
  }

  return grid;
}

export function getOccupancyGrid(grid: Grid): (GridItem | undefined)[][] {
  const occupancyGrid: (GridItem | undefined)[][] = Array.from(
    { length: grid.columns + 1 },
    () => Array.from({ length: grid.rows + 1 }, () => undefined),
  );

  grid.children?.forEach((widget) => {
    const startRow = widget.position.row;
    const startCol = widget.position.column;
    const rowSpan = widget.size.rowSpan;
    const colSpan = widget.size.colSpan;

    for (let c = startCol; c < startCol + colSpan; c++) {
      for (let r = startRow; r < startRow + rowSpan; r++) {
        if (r >= 1 && r <= grid.rows && c >= 1 && c <= grid.columns) {
          occupancyGrid[c][r] = widget;
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
