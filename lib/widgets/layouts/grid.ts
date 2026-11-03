import type { AbstractLayoutConfig } from "@/lib/widgets/layout";
import type WidgetConfig from "@/lib/widget";
import {
  getChildrenWithAdoptedChild,
  getChildrenWithDisownedChild,
  hasChild,
  InvalidItemConfigTypeError,
  ItemConfigNotFoundError,
  NoItemConfigError,
  type ItemConfig,
} from "@/lib/widget";
import { type CoordinateKey, getRecordWithoutKey } from "@/lib/utils";
import {
  getOverlapsBetweenItemAndArrangement,
  resolveOverlap,
} from "@/lib/widgets/layouts/grid/overlap";

export default interface GridConfig extends AbstractLayoutConfig {
  layout: "grid";
  rows: number;
  columns: number;
  children?: WidgetConfig["id"][];
  arrangement?: GridArrangement;
}

export function getGridConfigWithAdoptedChild(
  parent: GridConfig,
  child: WidgetConfig,
  deps: GetGridConfigWithAdoptedChildDeps,
) {
  if (hasChild(parent, child) && !deps.itemConfig) return parent;
  const gridItemConfig = ensureItemConfigParentTypeIsGrid(deps.itemConfig);

  const children = getChildrenWithAdoptedChild(parent, child);

  const arrangementWithUpsertedChild = upsertGridItemToArrangement(
    child.id,
    gridItemConfig,
    parent.arrangement,
  );

  const rearranged = rearrangeAroundItem(arrangementWithUpsertedChild, child.id);
  return { ...parent, children, arrangement: rearranged };
}

export interface GetGridConfigWithAdoptedChildDeps {
  itemConfig?: ItemConfig;
}

export function isGridChildRedundant(parent: GridConfig, child: WidgetConfig) {
  const itemConfig = getGridItemConfig(parent, child);

  return (
    (child.type === "slot" && is1x1GridItem(itemConfig)) ||
    isGridItemCollapsed(itemConfig)
  );
}

export function is1x1GridItem(itemConfig: GridItemConfig) {
  return itemConfig.size.rowSpan === 1 && itemConfig.size.colSpan === 1;
}

export function isGridItemCollapsed(itemConfig: GridItemConfig) {
  return itemConfig.size.rowSpan === 0 || itemConfig.size.colSpan === 0;
}

function ensureItemConfigParentTypeIsGrid(itemConfig?: ItemConfig) {
  if (!itemConfig) throw new NoItemConfigError({ requiredType: "grid" });

  if (itemConfig.parentType !== "grid")
    throw new InvalidItemConfigTypeError({
      requiredType: "grid",
      gotType: itemConfig.parentType,
    });

  return itemConfig;
}

function rearrangeAroundItem(arrangement: GridArrangement, itemId: WidgetConfig["id"]) {
  const overlaps = getOverlapsBetweenItemAndArrangement(itemId, arrangement);
  const resolved = overlaps.map(resolveOverlap);

  const resolvedArrangement = resolved.reduce(
    (acc, cur) => upsertGridItemToArrangement(cur.id, cur.itemConfig, acc),
    arrangement,
  );

  return resolvedArrangement;
}

function upsertGridItemToArrangement(
  id: WidgetConfig["id"],
  itemConfig: GridItemConfig,
  arrangement?: GridArrangement,
) {
  return { ...arrangement, [id]: itemConfig };
}

export function occupySameCells(first: GridItemConfig, second: GridItemConfig) {
  return (
    first.position.row === second.position.row &&
    first.position.column === second.position.column &&
    first.size.rowSpan === second.size.rowSpan &&
    first.size.colSpan === second.size.colSpan
  );
}

export function getGridConfigWithDisownedChild(parent: GridConfig, child: WidgetConfig) {
  const children = getChildrenWithDisownedChild(parent, child);
  const arrangement = getRecordWithoutKey(parent.arrangement, child.id);
  return { ...parent, children, arrangement };
}

export function getGridItemConfig(gridConfig: GridConfig, widgetConfig: WidgetConfig) {
  const itemConfig = gridConfig.arrangement?.[widgetConfig.id];

  if (!itemConfig)
    throw new ItemConfigNotFoundError({
      containerId: gridConfig.id,
      widgetConfigId: widgetConfig.id,
    });

  return itemConfig;
}

export function getGridItemsToRender(grid: GridConfig): GridItemToRender[] {
  if (!grid.arrangement) return [];

  const gridItemsToRender = [
    ...getGridItemsFromArrangement(grid.arrangement),
    ...getComputedGridSlots(grid),
  ];

  return gridItemsToRender;
}

export function getRenderedGridItemKey(item: GridItemToRender) {
  return item.id ?? getGridCoordinateKey(item.itemConfig.position);
}

export interface GridItemToRender {
  itemConfig: GridItemConfig;
  id?: WidgetConfig["id"];
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

export function getGridCoordinateKey(cell: GridItemPosition): CoordinateKey {
  return `${cell.row}-${cell.column}`;
}

function create1x1GridItemConfig(cell: GridItemPosition) {
  return {
    parentType: "grid",
    position: { ...cell },
    size: DEFAULT_GRID_ITEM_SIZE,
  } satisfies GridItemConfig;
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

export interface GridItemConfig {
  parentType: "grid";
  position: GridItemPosition;
  size: GridItemSize;
}

export interface GridItemPosition {
  row: number;
  column: number;
}

export interface GridItemSize {
  rowSpan: number;
  colSpan: number;
}

export type GridArrangement = Record<WidgetConfig["id"], GridItemConfig>;

export const DEFAULT_GRID_ITEM_SIZE = {
  rowSpan: 1,
  colSpan: 1,
} as const satisfies GridItemSize;
