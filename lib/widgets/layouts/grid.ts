import { v4 as uuid } from "uuid";

import { AbstractLayout } from "../layout";
import Void from "../void";

export default interface Grid extends AbstractLayout {
  layout: "grid";
  rows: number;
  columns: number;
}

export function fillGridWithVoids(grid: Grid): Grid {
  const voids: Void[] = [];
  const occupied: boolean[][] = getOccupancyGrid(grid);

  for (let c = 0; c < grid.columns; c++) {
    for (let r = 0; r < grid.rows; r++)
      if (!occupied[c][r])
        voids.push({
          id: uuid(),
          type: "void",
          position: { column: c, row: r },
          size: { colSpan: 1, rowSpan: 1 },
          parent: { ...grid, children: undefined },
        } as Void);
  }

  grid.children = [...(grid.children ?? []), ...voids];
  return grid;
}

export function getOccupancyGrid(grid: Grid): boolean[][] {
  const occupancyGrid: boolean[][] = Array.from({ length: grid.columns }).map(
    () => Array.from({ length: grid.rows }).map(() => false),
  );

  grid.children?.forEach((widget) => {
    const startRow = widget.position.row;
    const startCol = widget.position.column;
    const rowSpan = widget.size.rowSpan;
    const colSpan = widget.size.colSpan;

    for (let c = startCol; c < startCol + colSpan; c++) {
      for (let r = startRow; r < startRow + rowSpan; r++) {
        if (r >= 0 && r < grid.rows && c >= 0 && c < grid.columns)
          occupancyGrid[c][r] = true;
      }
    }
  });

  return occupancyGrid;
}
export const SPACING_OPTIONS = ["1", "2", "3", "4", "5", "6", "8", "9", "12"];
