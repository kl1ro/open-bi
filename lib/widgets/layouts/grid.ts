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

function getOverlapsBetweenItemAndArrangement(
  itemId: WidgetConfig["id"],
  arrangement: GridArrangement,
): GridItemOverlap[] {
  const suspectIds = Object.keys(arrangement).filter((id) => id !== itemId);

  const overlaps = suspectIds.flatMap(
    (id) => findOverlapInArrangement(itemId, id, arrangement) ?? [],
  );

  return overlaps;
}

function findOverlapInArrangement(
  overlappingItemId: WidgetConfig["id"],
  overlappedItemId: WidgetConfig["id"],
  arrangement: GridArrangement,
): GridItemOverlap | undefined {
  const overlappingItem = arrangement[overlappingItemId];
  const overlappedItem = arrangement[overlappedItemId];
  const overlap = findItemsOverlap(overlappingItem, overlappedItem);
  if (!overlap) return;
  return { overlappedItemId, overlappedItem, overlap };
}

export function findItemsOverlap(
  first: GridItemConfig,
  second: GridItemConfig,
): GridItemConfig | undefined {
  const [firstRect, secondRect] = [convertItemToRect(first), convertItemToRect(second)];
  const overlapRect = findRectsOverlap(firstRect, secondRect);
  if (!overlapRect) return;
  return convertRectToItem(overlapRect);
}

export function hasDelta(delta: GridResizeDelta) {
  return delta.rows !== 0 || delta.columns !== 0;
}

export function haveSameDelta(first: GridResizeDelta, second: GridResizeDelta) {
  return first.rows === second.rows && first.columns === second.columns;
}

export interface GridResizeDelta {
  rows: number;
  columns: number;
}

function convertItemToRect(item: GridItemConfig): GridRect {
  return {
    topLeft: item.position,

    bottomRight: {
      row: item.position.row + item.size.rowSpan - 1,
      column: item.position.column + item.size.colSpan - 1,
    },
  };
}

function findRectsOverlap(first: GridRect, second: GridRect): GridRect | undefined {
  const overlap = {
    topLeft: {
      row: Math.max(first.topLeft.row, second.topLeft.row),
      column: Math.max(first.topLeft.column, second.topLeft.column),
    },

    bottomRight: {
      row: Math.min(first.bottomRight.row, second.bottomRight.row),
      column: Math.min(first.bottomRight.column, second.bottomRight.column),
    },
  };

  if (isEmptyRect(overlap)) return;
  return overlap;
}

function convertRectToItem(rect: GridRect): GridItemConfig {
  return {
    parentType: "grid",
    position: rect.topLeft,
    size: {
      rowSpan: rect.bottomRight.row - rect.topLeft.row + 1,
      colSpan: rect.bottomRight.column - rect.topLeft.column + 1,
    },
  };
}

interface GridRect {
  topLeft: GridItemPosition;
  bottomRight: GridItemPosition;
}

function resolveOverlap(overlap: GridItemOverlap): {
  id: WidgetConfig["id"];
  itemConfig: GridItemConfig;
} {
  const options = getOverlapResolutionOptions(overlap);

  if (!options.length)
    return {
      id: overlap.overlappedItemId,
      itemConfig: getCollapsedItem(overlap.overlappedItem),
    };

  return {
    id: overlap.overlappedItemId,
    itemConfig: pickBestResolutionOption(options, overlap),
  };
}

function getOverlapResolutionOptions(overlap: GridItemOverlap): GridItemConfig[] {
  const itemRect = convertItemToRect(overlap.overlappedItem);
  const overlapRect = convertItemToRect(overlap.overlap);

  const resolutionOptions = getStripsAroundOverlap(itemRect, overlapRect)
    .filter((strip) => !isEmptyRect(strip))
    .map((strip) => convertRectToItem(strip));

  return resolutionOptions;
}

function pickBestResolutionOption(
  options: GridItemConfig[],
  deps: PickBestResolutionOptionDeps,
): GridItemConfig {
  const orderedByArea = options.toSorted((a, b) => getItemArea(b) - getItemArea(a));
  const maxArea = getItemArea(orderedByArea[0]);
  const withMaxArea = orderedByArea.filter((option) => getItemArea(option) === maxArea);
  const reference = deps.overlappedItem;

  const orderedByAspectDeviation = withMaxArea.toSorted(
    (a, b) => getAspectDeviation(a, reference) - getAspectDeviation(b, reference),
  );

  const bestOption = orderedByAspectDeviation[0];
  return bestOption;
}

type PickBestResolutionOptionDeps = Pick<GridItemOverlap, "overlappedItem">;

function getStripsAroundOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect[] {
  return [
    getStripAboveOverlap(itemRect, overlapRect),
    getStripBelowOverlap(itemRect, overlapRect),
    getStripLeftOfOverlap(itemRect, overlapRect),
    getStripRightOfOverlap(itemRect, overlapRect),
  ];
}

function isEmptyRect(rect: GridRect) {
  return (
    rect.topLeft.row > rect.bottomRight.row ||
    rect.topLeft.column > rect.bottomRight.column
  );
}

function getStripAboveOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: itemRect.topLeft,
    bottomRight: {
      row: overlapRect.topLeft.row - 1,
      column: itemRect.bottomRight.column,
    },
  };
}

function getStripBelowOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: {
      row: overlapRect.bottomRight.row + 1,
      column: itemRect.topLeft.column,
    },
    bottomRight: itemRect.bottomRight,
  };
}

function getStripLeftOfOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: itemRect.topLeft,
    bottomRight: {
      row: itemRect.bottomRight.row,
      column: overlapRect.topLeft.column - 1,
    },
  };
}

function getStripRightOfOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: {
      row: itemRect.topLeft.row,
      column: overlapRect.bottomRight.column + 1,
    },
    bottomRight: itemRect.bottomRight,
  };
}

function getItemArea(item: GridItemConfig) {
  return item.size.rowSpan * item.size.colSpan;
}

export function occupySameCells(first: GridItemConfig, second: GridItemConfig) {
  return (
    first.position.row === second.position.row &&
    first.position.column === second.position.column &&
    first.size.rowSpan === second.size.rowSpan &&
    first.size.colSpan === second.size.colSpan
  );
}

function getAspectDeviation(item: GridItemConfig, reference: GridItemConfig) {
  return Math.abs(
    Math.log(item.size.colSpan / item.size.rowSpan) -
      Math.log(reference.size.colSpan / reference.size.rowSpan),
  );
}

export function getCollapsedItem(item: GridItemConfig) {
  return {
    ...item,
    size: {
      rowSpan: 0,
      colSpan: 0,
    },
  };
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

  return [
    ...getGridItemsFromArrangement(grid.arrangement),
    ...getComputedGridSlots(grid),
  ];
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

export type GridArrangement = Record<string, GridItemConfig>;

interface GridItemOverlap {
  overlappedItemId: WidgetConfig["id"];
  overlappedItem: GridItemConfig;
  overlap: GridItemConfig;
}

export const DEFAULT_GRID_ITEM_SIZE = {
  rowSpan: 1,
  colSpan: 1,
} as const satisfies GridItemSize;
