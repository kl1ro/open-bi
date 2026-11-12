import type { PointerEvent } from "react";
import type GridConfig from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import type { GridItemConfig } from "@kl1ro/mip-bi-core/widgets/layouts/grid";

import {
  getRenderedGridItemKey,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import {
  getGesturePointerDelta,
  hasDelta,
  isGestureOwner,
  type AbstractGridGesture,
} from "@/lib/widgets/layouts/grid/gesture";
import type GridPreviewArea from "@/lib/widgets/layouts/grid/preview";
import { getDragPreview, type GridPreviewRole } from "@/lib/widgets/layouts/grid/preview";
import { clamp } from "@/lib/utils";

export default interface GridMove extends AbstractGridGesture {
  kind: "move";
}

export function getMovePreview(
  move: GridMove | undefined,
  deps: GetMovePreviewDeps,
): GridPreviewArea[] {
  if (!move) return [];
  if (!hasDelta(move.delta)) return getMovePressPreview(move, deps);
  return getMoveDragPreview(move, deps);
}

export interface GetMovePreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

export function getMoveWithPointerDelta(
  move: GridMove,
  event: PointerEvent<HTMLElement>,
): GridMove {
  const delta = getGesturePointerDelta(move, event);
  return { ...move, delta };
}

export function getMovedItemConfig(
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

export interface GetMovedItemConfigDeps {
  grid: GridConfig;
}

function getMovePressPreview(
  move: GridMove,
  deps: GetMovePressPreviewDeps,
): GridPreviewArea[] {
  const innerDeps = { ...deps, move };

  const pressPreview = deps.itemsToRender.map((item) =>
    getItemAreaOnMovePress(item, innerDeps),
  );

  return pressPreview;
}

interface GetMovePressPreviewDeps {
  itemsToRender: GridItemToRender[];
}

function getMoveDragPreview(
  move: GridMove,
  deps: GetMoveDragPreviewDeps,
): GridPreviewArea[] {
  const movedItemConfig = getMovedItemConfig(move, deps);

  const innerDeps = {
    ...deps,
    itemConfig: movedItemConfig,
    ownerRole: "moved" as const,
  };

  return getDragPreview(move, innerDeps);
}

interface GetMoveDragPreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
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

interface GetItemRoleOnMovePressDeps {
  move: GridMove;
}
