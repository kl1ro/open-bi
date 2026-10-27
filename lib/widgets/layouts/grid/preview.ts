import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  findItemsOverlap,
  getGridConfigWithAdoptedChild,
  getGridItemConfig,
  getRenderedGridItemKey,
  isGridItemCollapsed,
  occupySameCells,
  type GridItemConfig,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import {
  isGestureOwner,
  type AbstractGridGesture,
} from "@/lib/widgets/layouts/grid/gesture";

export default interface GridPreviewArea {
  key: string;
  itemConfig: GridItemConfig;
  role: GridPreviewRole;
}

export function getDragPreview(
  gesture: AbstractGridGesture,
  deps: GetDragPreviewDeps,
): GridPreviewArea[] {
  const adoptionDeps = { itemConfig: deps.targetItemConfig };

  const previewGrid = getGridConfigWithAdoptedChild(
    deps.grid,
    gesture.owner.child,
    adoptionDeps,
  );

  const itemAreaDeps = { gesture, previewGrid, ownerRole: deps.ownerRole };

  const dragPreview = deps.itemsToRender.flatMap(
    (item) => findItemAreaOnDrag(item, itemAreaDeps) ?? [],
  );

  return dragPreview;
}

export interface GetDragPreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  targetItemConfig: GridItemConfig;
  ownerRole: GridPreviewRole;
}

function findItemAreaOnDrag(
  item: GridItemToRender,
  deps: FindItemAreaOnDragDeps,
): GridPreviewArea | undefined {
  if (isGestureOwner(item, deps.gesture)) return getOwnerArea(deps);

  const previewItemConfig = findPreviewItemConfig(item, deps);
  if (!previewItemConfig) return findComputedSlotAreaOnDrag(item, deps);

  const key = getRenderedGridItemKey(item);

  if (isGridItemCollapsed(previewItemConfig))
    return { key, itemConfig: item.itemConfig, role: "eaten" };

  if (occupySameCells(item.itemConfig, previewItemConfig))
    return { key, itemConfig: item.itemConfig, role: "unaffected" };

  return { key, itemConfig: previewItemConfig, role: "affected" };
}

interface FindItemAreaOnDragDeps {
  gesture: AbstractGridGesture;
  previewGrid: GridConfig;
  ownerRole: GridPreviewRole;
}

function getOwnerArea(deps: GetOwnerAreaDeps): GridPreviewArea {
  const { owner } = deps.gesture;
  const previewItemConfig = getOwnerPreviewItemConfig(deps);

  if (isGridItemCollapsed(previewItemConfig))
    return { key: owner.key, itemConfig: owner.itemConfig, role: "eaten" };

  return { key: owner.key, itemConfig: previewItemConfig, role: deps.ownerRole };
}

type GetOwnerAreaDeps = FindItemAreaOnDragDeps;

function findPreviewItemConfig(
  item: GridItemToRender,
  deps: FindPreviewItemConfigDeps,
): GridItemConfig | undefined {
  if (!item.id) return;
  return deps.previewGrid.arrangement?.[item.id];
}

type FindPreviewItemConfigDeps = Pick<FindItemAreaOnDragDeps, "previewGrid">;

function findComputedSlotAreaOnDrag(
  item: GridItemToRender,
  deps: FindComputedSlotAreaOnDragDeps,
): GridPreviewArea | undefined {
  if (findItemsOverlap(item.itemConfig, getOwnerPreviewItemConfig(deps))) return;

  return {
    key: getRenderedGridItemKey(item),
    itemConfig: item.itemConfig,
    role: "unaffected",
  };
}

type FindComputedSlotAreaOnDragDeps = FindItemAreaOnDragDeps;

function getOwnerPreviewItemConfig(deps: GetOwnerPreviewItemConfigDeps) {
  return getGridItemConfig(deps.previewGrid, deps.gesture.owner.child);
}

type GetOwnerPreviewItemConfigDeps = FindItemAreaOnDragDeps;

export type GridPreviewRole =
  | "focused"
  | "resized"
  | "moved"
  | "affected"
  | "eaten"
  | "unaffected";
