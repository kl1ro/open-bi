import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";

import type { GridGestureState } from "@/components/widgets/layouts/GridWidget";
import type { GridResizeHandleConfig } from "@/components/widgets/layouts/grid/GridResizeHandles";
import {
  createGesture,
  isGestureInProgress,
  getDragPreview,
  getGridGestureDelta,
  isGestureOwner,
  takeOverPointerEvent,
  type AbstractGridGesture,
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
import type { AppStore } from "@/state/store";

export default function useGridResize(deps: UseGridResizeDeps) {
  const resize = findOngoingResize(deps);
  const resizeDeps = { ...deps, resize };

  return {
    value: resize,
    preview: getResizePreview(resize, deps),
    tryStart: (startDeps: GridResizeStartDeps) =>
      tryStartResize({ ...deps, ...startDeps }),
    continue: (event: PointerEvent<HTMLElement>) =>
      continueResize({ ...resizeDeps, event }),
    tryFinish: (event: PointerEvent<HTMLElement>) =>
      tryFinishResize({ ...resizeDeps, event }),
    reset: () => resetResize(deps),
  };
}

export interface UseGridResizeDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  gesture: GridGestureState;
}

export interface GridResizeStartDeps {
  event: PointerEvent<HTMLElement>;
  handle: GridResizeHandleConfig;
  item: GridItemToRender;
}

function findOngoingResize(deps: FindOngoingResizeDeps): GridResize | undefined {
  if (deps.gesture.value?.kind !== "resize") return;
  return deps.gesture.value;
}

type FindOngoingResizeDeps = Pick<UseGridResizeDeps, "gesture">;

function getResizePreview(
  resize: GridResize | undefined,
  deps: GetResizePreviewDeps,
): GridPreviewArea[] {
  if (!resize) return [];
  if (!hasDelta(resize.delta)) return getResizePressPreview(resize, deps);
  return getResizeDragPreview(resize, deps);
}

type GetResizePreviewDeps = UseGridResizeDeps;

function tryStartResize(deps: TryStartResizeDeps) {
  if (isGestureInProgress(deps)) return;

  try {
    const gesture = createGesture(deps);
    takeOverPointerEvent(deps.event);
    deps.gesture.set({ ...gesture, kind: "resize", handle: deps.handle });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать изменение размера виджета");
  }
}

type TryStartResizeDeps = UseGridResizeDeps & GridResizeStartDeps;

function continueResize(deps: ContinueResizeDeps) {
  if (!deps.resize) return;
  const delta = getGridResizeDelta(deps.resize, deps);
  if (haveSameDelta(delta, deps.resize.delta)) return;
  deps.gesture.set({ ...deps.resize, delta });
}

type ContinueResizeDeps = Pick<UseGridResizeDeps, "gesture"> & {
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
};

function tryFinishResize(deps: TryFinishResizeDeps) {
  if (!deps.resize) return;

  try {
    const delta = getGridResizeDelta(deps.resize, deps);
    const updatedResize = { ...deps.resize, delta };
    applyResize(updatedResize, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось изменить размер виджета");
  }

  resetResize(deps);
}

type TryFinishResizeDeps = Pick<UseGridResizeDeps, "gesture" | "grid" | "store"> & {
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
};

function resetResize(deps: ResetResizeDeps) {
  deps.gesture.set(undefined);
}

type ResetResizeDeps = Pick<UseGridResizeDeps, "gesture">;

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

type ApplyResizeDeps = Pick<UseGridResizeDeps, "grid" | "store">;

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

function isTouchedByFirstStep(item: GridItemToRender, deps: IsTouchedByFirstStepDeps) {
  return Boolean(findItemsOverlap(item.itemConfig, deps.firstStep));
}

type IsTouchedByFirstStepDeps = Pick<GetItemRoleOnResizePressDeps, "firstStep">;

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

export interface GridResize extends AbstractGridGesture {
  kind: "resize";
  handle: GridResizeHandleConfig;
}

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
