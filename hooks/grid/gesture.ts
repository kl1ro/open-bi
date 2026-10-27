import { useState, type PointerEvent, type RefObject } from "react";

import type { GridMove } from "@/hooks/grid/move";
import type { GridResize } from "@/hooks/grid/resize";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  findItemsOverlap,
  getGridConfigWithAdoptedChild,
  getGridItemConfig,
  getRenderedGridItemKey,
  isGridItemCollapsed,
  occupySameCells,
  type GridDelta,
  type GridItemConfig,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import type WidgetConfig from "@/lib/widget";
import { findWidgetConfig } from "@/lib/widget";
import { createSlotConfig } from "@/lib/widgets/slot";
import type { AppStore } from "@/state/store";

export default function useGridGesture() {
  const [value, set] = useState<GridGesture>();
  return { value, set };
}

export type GridGestureState = ReturnType<typeof useGridGesture>;

export function isGestureOwner(
  item: GridItemToRender,
  gesture: AbstractGridGesture | undefined,
) {
  return gesture?.owner.key === getRenderedGridItemKey(item);
}

export function findNewGesture(
  deps: FindNewGestureDeps,
): AbstractGridGesture | undefined {
  if (isGestureInProgress(deps)) return;
  const owner = findGestureOwner(deps.item, deps);
  const container = deps.container.current;
  if (!owner || !container) return;
  const cellPitchDeps = { container, grid: deps.grid };

  return {
    owner,
    startPoint: { clientX: deps.event.clientX, clientY: deps.event.clientY },
    cellPitch: measureCellPitch(cellPitchDeps),
    delta: { rows: 0, columns: 0 },
  };
}

export interface FindNewGestureDeps {
  event: PointerEvent<HTMLElement>;
  item: GridItemToRender;
  grid: GridConfig;
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  gesture: GridGestureState;
}

export function takeOverPointerEvent(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
}

export function getGridGestureDelta(
  gesture: AbstractGridGesture,
  deps: GetGridGestureDeltaDeps,
): GridDelta {
  const [rows, columns] = [
    (deps.event.clientY - gesture.startPoint.clientY) / gesture.cellPitch.height,
    (deps.event.clientX - gesture.startPoint.clientX) / gesture.cellPitch.width,
  ];

  return { rows: Math.round(rows), columns: Math.round(columns) };
}

export interface GetGridGestureDeltaDeps {
  event: PointerEvent<HTMLElement>;
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

function isGestureInProgress(deps: IsGestureInProgressDeps) {
  return Boolean(deps.gesture.value);
}

type IsGestureInProgressDeps = Pick<FindNewGestureDeps, "gesture">;

function findGestureOwner(
  item: GridItemToRender,
  deps: FindGestureOwnerDeps,
): GridGestureOwner | undefined {
  const widgetConfigsDeps = {
    widgetConfigs: deps.store.getState().dashboard.widgetConfigs,
  };

  const child = item.id
    ? findWidgetConfig(item.id, widgetConfigsDeps)
    : createSlotConfig(deps.grid.id);

  if (!child) return;
  return { key: getRenderedGridItemKey(item), child, itemConfig: item.itemConfig };
}

type FindGestureOwnerDeps = Pick<FindNewGestureDeps, "grid" | "store">;

function measureCellPitch(deps: MeasureCellPitchDeps): GridCellPitch {
  const style = getComputedStyle(deps.container);

  return {
    width: (deps.container.clientWidth + parseFloat(style.columnGap)) / deps.grid.columns,
    height: (deps.container.clientHeight + parseFloat(style.rowGap)) / deps.grid.rows,
  };
}

interface MeasureCellPitchDeps {
  container: HTMLElement;
  grid: GridConfig;
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

export type GridGesture = GridResize | GridMove;

export interface AbstractGridGesture {
  owner: GridGestureOwner;
  startPoint: { clientX: number; clientY: number };
  cellPitch: GridCellPitch;
  delta: GridDelta;
}

export interface GridGestureOwner {
  key: string;
  child: WidgetConfig;
  itemConfig: GridItemConfig;
}

export interface GridCellPitch {
  width: number;
  height: number;
}

export interface GridPreviewArea {
  key: string;
  itemConfig: GridItemConfig;
  role: GridPreviewRole;
}

export type GridPreviewRole =
  | "focused"
  | "resized"
  | "moved"
  | "affected"
  | "eaten"
  | "unaffected";
