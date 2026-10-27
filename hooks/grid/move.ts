import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";

import {
  createGesture,
  isGestureInProgress,
  getDragPreview,
  getGridGestureDelta,
  isGestureOwner,
  takeOverPointerEvent,
  type AbstractGridGesture,
  type GridGestureState,
  type GridPreviewArea,
  type GridPreviewRole,
} from "@/hooks/grid/gesture";
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
import type { AppStore } from "@/state/store";

export default function useGridMove(deps: UseGridMoveDeps) {
  const move = findOngoingMove(deps);
  const moveDeps = { ...deps, move };

  return {
    value: move,
    preview: getMovePreview(move, deps),
    tryStart: (startDeps: GridMoveStartDeps) => tryStartMove({ ...deps, ...startDeps }),
    continue: (event: PointerEvent<HTMLElement>) => continueMove({ ...moveDeps, event }),
    tryFinish: (event: PointerEvent<HTMLElement>) =>
      tryFinishMove({ ...moveDeps, event }),
    reset: () => resetMove(deps),
  };
}

export interface UseGridMoveDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  gesture: GridGestureState;
}

export interface GridMoveStartDeps {
  event: PointerEvent<HTMLElement>;
  item: GridItemToRender;
}

function findOngoingMove(deps: FindOngoingMoveDeps): GridMove | undefined {
  if (deps.gesture.value?.kind !== "move") return;
  return deps.gesture.value;
}

type FindOngoingMoveDeps = Pick<UseGridMoveDeps, "gesture">;

function getMovePreview(
  move: GridMove | undefined,
  deps: GetMovePreviewDeps,
): GridPreviewArea[] {
  if (!move) return [];
  if (!hasDelta(move.delta)) return getMovePressPreview(move, deps);
  return getMoveDragPreview(move, deps);
}

type GetMovePreviewDeps = UseGridMoveDeps;

function tryStartMove(deps: TryStartMoveDeps) {
  if (isGestureInProgress(deps)) return;

  try {
    const gesture = createGesture(deps);
    takeOverPointerEvent(deps.event);
    deps.gesture.set({ ...gesture, kind: "move" });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать перемещение виджета");
  }
}

type TryStartMoveDeps = UseGridMoveDeps & GridMoveStartDeps;

function continueMove(deps: ContinueMoveDeps) {
  if (!deps.move) return;
  const delta = getGridGestureDelta(deps.move, deps);
  if (haveSameDelta(delta, deps.move.delta)) return;
  deps.gesture.set({ ...deps.move, delta });
}

type ContinueMoveDeps = Pick<UseGridMoveDeps, "gesture"> & {
  move?: GridMove;
  event: PointerEvent<HTMLElement>;
};

function tryFinishMove(deps: TryFinishMoveDeps) {
  if (!deps.move) return;

  try {
    const delta = getGridGestureDelta(deps.move, deps);
    const updatedMove = { ...deps.move, delta };
    applyMove(updatedMove, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось переместить виджет");
  }

  resetMove(deps);
}

type TryFinishMoveDeps = Pick<UseGridMoveDeps, "gesture" | "grid" | "store"> & {
  move?: GridMove;
  event: PointerEvent<HTMLElement>;
};

function resetMove(deps: ResetMoveDeps) {
  deps.gesture.set(undefined);
}

type ResetMoveDeps = Pick<UseGridMoveDeps, "gesture">;

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

function applyMove(move: GridMove, deps: ApplyMoveDeps) {
  const itemConfig = getMovedItemConfig(move, deps);
  if (occupySameCells(move.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: move.owner.child, itemConfig }));
}

type ApplyMoveDeps = Pick<UseGridMoveDeps, "grid" | "store">;

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

function getItemRoleOnMovePress(
  item: GridItemToRender,
  deps: GetItemRoleOnMovePressDeps,
): GridPreviewRole {
  return isGestureOwner(item, deps.move) ? "focused" : "unaffected";
}

type GetItemRoleOnMovePressDeps = GetItemAreaOnMovePressDeps;

export interface GridMove extends AbstractGridGesture {
  kind: "move";
}
