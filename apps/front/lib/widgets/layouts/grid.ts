import type GridConfig from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import type {
  GridArrangement,
  GridItemConfig,
  GridItemPosition,
  GridItemSize,
} from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import type WidgetConfig from "@kl1ro/mip-bi-core/widget";

import type { CoordinateKey } from "@/lib/utils";

export function getGridItemsToRender(grid: GridConfig): GridItemToRender[] {
  if (!grid.arrangement) return [];

  const gridItemsToRender = [
    ...getGridItemsFromArrangement(grid.arrangement),
    ...getComputedGridSlots(grid),
  ];

  return gridItemsToRender;
}

export interface GridItemToRender {
  itemConfig: GridItemConfig;
  id?: WidgetConfig["id"];
}

export function getRenderedGridItemKey(item: GridItemToRender) {
  return item.id ?? getGridCoordinateKey(item.itemConfig.position);
}

function getGridItemsFromArrangement(arrangement: GridArrangement): GridItemToRender[] {
  const gridItems = Object.entries(arrangement).map(([id, itemConfig]) => ({
    id,
    itemConfig,
  }));

  return gridItems;
}

function getComputedGridSlots(grid: GridConfig): GridItemToRender[] {
  const occupancy = getGridOccupancy(grid);

  const computedSlots = getGridCells(grid)
    .filter((cell) => !occupancy[getGridCoordinateKey(cell)])
    .map((cell) => ({ itemConfig: create1x1GridItemConfig(cell) }));

  return computedSlots;
}

export function getGridCoordinateKey(cell: GridItemPosition): CoordinateKey {
  return `${cell.row}-${cell.column}`;
}

export function getGridOccupancy(grid: GridConfig) {
  const occupancy: Record<CoordinateKey, WidgetConfig["id"] | undefined> = {};
  if (!grid.arrangement) return occupancy;

  for (const cell of getGridCells(grid))
    occupancy[getGridCoordinateKey(cell)] = getGridCellOccupancyInArrangement(
      cell,
      grid.arrangement,
    );

  return occupancy;
}

function getGridCells(grid: GridConfig) {
  const cells: GridItemPosition[] = [];

  for (let row = 1; row <= grid.rows; row++)
    for (let column = 1; column <= grid.columns; column++) cells.push({ row, column });

  return cells;
}

function create1x1GridItemConfig(cell: GridItemPosition): GridItemConfig {
  return {
    parentType: "grid",
    position: { ...cell },
    size: DEFAULT_GRID_ITEM_SIZE,
  };
}

function getGridCellOccupancyInArrangement(
  cell: GridItemPosition,
  arrangement: GridArrangement,
) {
  const occupyingEntry = Object.entries(arrangement).find(([, itemConfig]) =>
    isCellInsideGridItem(cell, itemConfig),
  );

  const occupyingId = occupyingEntry?.[0];
  return occupyingId;
}

function isCellInsideGridItem(cell: GridItemPosition, item: GridItemConfig) {
  return (
    cell.row >= item.position.row &&
    cell.row < item.position.row + item.size.rowSpan &&
    cell.column >= item.position.column &&
    cell.column < item.position.column + item.size.colSpan
  );
}

export const SPACING_OPTIONS = ["1", "2", "3", "4", "5", "6", "8", "9", "12"] as const;

export const DEFAULT_GRID_ITEM_SIZE = {
  rowSpan: 1,
  colSpan: 1,
} as const satisfies GridItemSize;
