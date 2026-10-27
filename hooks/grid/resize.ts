import { useState, type PointerEvent } from "react";
import { toast } from "sonner";

import type { GridWidgetState } from "@/components/widgets/layouts/GridWidget";
import type { GridResizeHandleConfig } from "@/components/widgets/layouts/grid/GridResizeHandles";
import type GridGesture from "@/hooks/grid/gesture";
import {
  findNewGesture,
  getDragPreview,
  getGridGestureDelta,
  isGestureOwner,
  takeOverPointerEvent,
  type GridPreviewArea,
  type GridPreviewRole,
} from "@/hooks/grid/gesture";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  findItemsOverlap,
  getRenderedGridItemKey,
  hasDelta,
  haveSameDelta,
  type GridDelta,
  type GridItemConfig,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import { clamp } from "@/lib/utils";
import { upsertWidget } from "@/state/features/dashboard";

export default interface GridResize extends GridGesture {
  handle: GridResizeHandleConfig;
}

export function useGridResize(deps: UseGridResizeDeps) {
  const [value, set] = useState<GridResize>();
  return { value, set, preview: getResizePreview(value, deps) };
}

export interface UseGridResizeDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

export function startResize(deps: StartResizeDeps) {
  const gesture = findNewGesture(deps);
  if (!gesture) return;
  takeOverPointerEvent(deps.event);
  deps.gridState.resize.set({ ...gesture, handle: deps.handle });
}

export interface StartResizeDeps {
  event: PointerEvent<HTMLElement>;
  handle: GridResizeHandleConfig;
  item: GridItemToRender;
  gridState: GridWidgetState;
}

export function continueResize(deps: ContinueResizeDeps) {
  if (!deps.resize.value) return;
  const delta = getGridResizeDelta(deps.resize.value, deps);
  if (haveSameDelta(delta, deps.resize.value.delta)) return;
  deps.resize.set({ ...deps.resize.value, delta });
}

export type ContinueResizeDeps = Pick<GridWidgetState, "resize"> & {
  event: PointerEvent<HTMLElement>;
};

export function tryFinishResize(deps: TryFinishResizeDeps) {
  if (!deps.resize.value) return;

  try {
    const delta = getGridResizeDelta(deps.resize.value, deps);
    const updatedResize = { ...deps.resize.value, delta };
    applyResize(updatedResize, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось изменить размер виджета");
  }

  resetResize(deps);
}

export type TryFinishResizeDeps = Pick<GridWidgetState, "resize" | "grid" | "store"> & {
  event: PointerEvent<HTMLElement>;
};

export function resetResize(deps: ResetResizeDeps) {
  deps.resize.set(undefined);
}

export type ResetResizeDeps = Pick<GridWidgetState, "resize">;

function getResizePreview(
  resize: GridResize | undefined,
  deps: GetResizePreviewDeps,
): GridPreviewArea[] {
  if (!resize) return [];
  if (!hasDelta(resize.delta)) return getResizePressPreview(resize, deps);
  return getResizeDragPreview(resize, deps);
}

type GetResizePreviewDeps = UseGridResizeDeps;

function getGridResizeDelta(resize: GridResize, deps: GetGridResizeDeltaDeps): GridDelta {
  const axes = new Set(resize.handle.sides.map((side) => RESIZE_SIDES[side].axis));
  const gestureDelta = getGridGestureDelta(resize, deps);

  return {
    rows: axes.has("rows") ? gestureDelta.rows : 0,
    columns: axes.has("columns") ? gestureDelta.columns : 0,
  };
}

interface GetGridResizeDeltaDeps {
  event: PointerEvent<HTMLElement>;
}

function applyResize(resize: GridResize, deps: ApplyResizeDeps) {
  if (!hasDelta(resize.delta)) return;
  const itemConfig = getResizedItemConfig(resize, deps);
  deps.store.dispatch(upsertWidget({ widgetConfig: resize.owner.child, itemConfig }));
}

type ApplyResizeDeps = Pick<GridWidgetState, "grid" | "store">;

function getResizePressPreview(
  resize: GridResize,
  deps: GetResizePressPreviewDeps,
): GridPreviewArea[] {
  const firstStep = getFirstStepItemConfig(resize, deps);
  const itemAreaDeps = { resize, firstStep };

  const pressPreview = deps.itemsToRender.map((item) =>
    getItemAreaOnResizePress(item, itemAreaDeps),
  );

  return pressPreview;
}

type GetResizePressPreviewDeps = GetResizePreviewDeps;

function getResizeDragPreview(
  resize: GridResize,
  deps: GetResizeDragPreviewDeps,
): GridPreviewArea[] {
  const resizedItemConfig = getResizedItemConfig(resize, deps);

  const dragDeps = {
    ...deps,
    targetItemConfig: resizedItemConfig,
    ownerRole: "resized" as const,
  };

  return getDragPreview(resize, dragDeps);
}

type GetResizeDragPreviewDeps = GetResizePreviewDeps;

function getResizedItemConfig(
  resize: GridResize,
  deps: GetResizedItemConfigDeps,
): GridItemConfig {
  const resizedItemConfig = resize.handle.sides.reduce(
    (itemConfig, side) =>
      getItemConfigResizedAtSide(itemConfig, side, { resize, grid: deps.grid }),
    resize.owner.itemConfig,
  );

  return resizedItemConfig;
}

interface GetResizedItemConfigDeps {
  grid: GridConfig;
}

function getFirstStepItemConfig(
  resize: GridResize,
  deps: GetFirstStepItemConfigDeps,
): GridItemConfig {
  const firstStepResize = { ...resize, delta: getOutwardStepDelta(resize.handle) };
  return getResizedItemConfig(firstStepResize, deps);
}

type GetFirstStepItemConfigDeps = Pick<GetResizePressPreviewDeps, "grid">;

function getItemAreaOnResizePress(
  item: GridItemToRender,
  deps: GetItemAreaOnResizePressDeps,
): GridPreviewArea {
  return {
    key: getRenderedGridItemKey(item),
    itemConfig: item.itemConfig,
    role: getItemRoleOnResizePress(item, deps),
  };
}

interface GetItemAreaOnResizePressDeps {
  resize: GridResize;
  firstStep: GridItemConfig;
}

function getItemConfigResizedAtSide(
  itemConfig: GridItemConfig,
  side: GridResizeSide,
  deps: GetItemConfigResizedAtSideDeps,
) {
  const geometry = RESIZE_SIDES[side];
  const delta = deps.resize.delta[geometry.axis];
  const sideDeps = { geometry, delta, grid: deps.grid };

  return geometry.direction === "forward"
    ? getItemConfigResizedForward(itemConfig, sideDeps)
    : getItemConfigResizedBackward(itemConfig, sideDeps);
}

interface GetItemConfigResizedAtSideDeps {
  resize: GridResize;
  grid: GridConfig;
}

function getOutwardStepDelta(handle: GridResizeHandleConfig): GridDelta {
  const outwardStepDelta = handle.sides.reduce<GridDelta>(
    (delta, side) => {
      const geometry = RESIZE_SIDES[side];
      return { ...delta, [geometry.axis]: geometry.direction === "forward" ? 1 : -1 };
    },
    { rows: 0, columns: 0 },
  );

  return outwardStepDelta;
}

function getItemRoleOnResizePress(
  item: GridItemToRender,
  deps: GetItemRoleOnResizePressDeps,
): GridPreviewRole {
  if (isGestureOwner(item, deps.resize)) return "focused";
  return isTouchedByFirstStep(item, deps) ? "affected" : "unaffected";
}

type GetItemRoleOnResizePressDeps = GetItemAreaOnResizePressDeps;

function getItemConfigResizedForward(
  itemConfig: GridItemConfig,
  deps: GetItemConfigResizedForwardDeps,
): GridItemConfig {
  const { position, size } = itemConfig;
  const { geometry, delta, grid } = deps;
  const maxSpan = grid[geometry.axis] - position[geometry.position] + 1;
  const span = clamp(size[geometry.span] + delta, 0, maxSpan);
  return { ...itemConfig, size: { ...size, [geometry.span]: span } };
}

interface GetItemConfigResizedForwardDeps {
  geometry: GridResizeSideGeometry;
  delta: number;
  grid: GridConfig;
}

function getItemConfigResizedBackward(
  itemConfig: GridItemConfig,
  deps: GetItemConfigResizedBackwardDeps,
): GridItemConfig {
  const { position, size } = itemConfig;
  const { geometry, delta } = deps;
  const growth = clamp(-delta, -size[geometry.span], position[geometry.position] - 1);

  return {
    ...itemConfig,
    position: { ...position, [geometry.position]: position[geometry.position] - growth },
    size: { ...size, [geometry.span]: size[geometry.span] + growth },
  };
}

interface GetItemConfigResizedBackwardDeps {
  geometry: GridResizeSideGeometry;
  delta: number;
}

function isTouchedByFirstStep(item: GridItemToRender, deps: IsTouchedByFirstStepDeps) {
  return Boolean(findItemsOverlap(item.itemConfig, deps.firstStep));
}

type IsTouchedByFirstStepDeps = Pick<GetItemRoleOnResizePressDeps, "firstStep">;

export type GridResizeSide = "top" | "bottom" | "left" | "right";

const RESIZE_SIDES = {
  top: { axis: "rows", direction: "backward", position: "row", span: "rowSpan" },
  bottom: { axis: "rows", direction: "forward", position: "row", span: "rowSpan" },
  left: { axis: "columns", direction: "backward", position: "column", span: "colSpan" },
  right: { axis: "columns", direction: "forward", position: "column", span: "colSpan" },
} as const satisfies { [Side in GridResizeSide]: GridResizeSideGeometry };

interface GridResizeSideGeometry {
  axis: keyof GridDelta;
  direction: "forward" | "backward";
  position: keyof GridItemConfig["position"];
  span: keyof GridItemConfig["size"];
}
