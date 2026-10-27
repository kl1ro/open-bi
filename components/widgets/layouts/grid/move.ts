import { useState, type PointerEvent } from "react";
import { toast } from "sonner";

import type { GridWidgetState } from "@/components/widgets/layouts/GridWidget";
import type GridGesture from "@/components/widgets/layouts/grid/gesture";
import {
  findNewGesture,
  getDragPreview,
  getGridGestureDelta,
  isGestureOwner,
  takeOverPointerEvent,
  type GridPreviewArea,
  type GridPreviewRole,
} from "@/components/widgets/layouts/grid/gesture";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  getRenderedGridItemKey,
  hasDelta,
  haveSameDelta,
  occupySameCells,
  type GridItemConfig,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import { clamp } from "@/lib/utils";
import { upsertWidget } from "@/state/features/dashboard";

type GridMove = GridGesture;

export default GridMove;

export function useGridMove(deps: UseGridMoveDeps) {
  const [value, set] = useState<GridMove>();
  return { value, set, preview: getMovePreview(value, deps) };
}

export interface UseGridMoveDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

export function startMove(deps: StartMoveDeps) {
  const move = findNewGesture(deps);
  if (!move) return;
  takeOverPointerEvent(deps.event);
  deps.gridState.move.set(move);
}

export interface StartMoveDeps {
  event: PointerEvent<HTMLElement>;
  item: GridItemToRender;
  gridState: GridWidgetState;
}

export function continueMove(deps: ContinueMoveDeps) {
  if (!deps.move.value) return;
  const delta = getGridGestureDelta(deps.move.value, deps);
  if (haveSameDelta(delta, deps.move.value.delta)) return;
  deps.move.set({ ...deps.move.value, delta });
}

export type ContinueMoveDeps = Pick<GridWidgetState, "move"> & {
  event: PointerEvent<HTMLElement>;
};

export function tryFinishMove(deps: TryFinishMoveDeps) {
  if (!deps.move.value) return;

  try {
    const delta = getGridGestureDelta(deps.move.value, deps);
    const updatedMove = { ...deps.move.value, delta };
    applyMove(updatedMove, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось переместить виджет");
  }

  resetMove(deps);
}

export type TryFinishMoveDeps = Pick<GridWidgetState, "move" | "grid" | "store"> & {
  event: PointerEvent<HTMLElement>;
};

export function resetMove(deps: ResetMoveDeps) {
  deps.move.set(undefined);
}

export type ResetMoveDeps = Pick<GridWidgetState, "move">;

function getMovePreview(
  move: GridMove | undefined,
  deps: GetMovePreviewDeps,
): GridPreviewArea[] {
  if (!move) return [];
  if (!hasDelta(move.delta)) return getMovePressPreview(move, deps);
  return getMoveDragPreview(move, deps);
}

type GetMovePreviewDeps = UseGridMoveDeps;

function applyMove(move: GridMove, deps: ApplyMoveDeps) {
  const itemConfig = getMovedItemConfig(move, deps);
  if (occupySameCells(move.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: move.owner.child, itemConfig }));
}

type ApplyMoveDeps = Pick<GridWidgetState, "grid" | "store">;

function getMovePressPreview(
  move: GridMove,
  deps: GetMovePressPreviewDeps,
): GridPreviewArea[] {
  const itemAreaDeps = { move };

  const pressPreview = deps.itemsToRender.map((item) =>
    getItemAreaOnMovePress(item, itemAreaDeps),
  );

  return pressPreview;
}

type GetMovePressPreviewDeps = GetMovePreviewDeps;

function getMoveDragPreview(
  move: GridMove,
  deps: GetMoveDragPreviewDeps,
): GridPreviewArea[] {
  const movedItemConfig = getMovedItemConfig(move, deps);

  const dragDeps = {
    ...deps,
    targetItemConfig: movedItemConfig,
    ownerRole: "moved" as const,
  };

  return getDragPreview(move, dragDeps);
}

type GetMoveDragPreviewDeps = GetMovePreviewDeps;

function getMovedItemConfig(
  move: GridMove,
  deps: GetMovedItemConfigDeps,
): GridItemConfig {
  const { position, size } = move.owner.itemConfig;
  const { delta } = move;
  const { grid } = deps;

  const movedPosition = {
    row: clamp(position.row + delta.rows, 1, grid.rows - size.rowSpan + 1),
    column: clamp(position.column + delta.columns, 1, grid.columns - size.colSpan + 1),
  };

  return { ...move.owner.itemConfig, position: movedPosition };
}

interface GetMovedItemConfigDeps {
  grid: GridConfig;
}

function getItemAreaOnMovePress(
  item: GridItemToRender,
  deps: GetItemAreaOnMovePressDeps,
): GridPreviewArea {
  return {
    key: getRenderedGridItemKey(item),
    itemConfig: item.itemConfig,
    role: getItemRoleOnMovePress(item, deps),
  };
}

interface GetItemAreaOnMovePressDeps {
  move: GridMove;
}

function getItemRoleOnMovePress(
  item: GridItemToRender,
  deps: GetItemRoleOnMovePressDeps,
): GridPreviewRole {
  return isGestureOwner(item, deps.move) ? "focused" : "unaffected";
}

type GetItemRoleOnMovePressDeps = GetItemAreaOnMovePressDeps;
