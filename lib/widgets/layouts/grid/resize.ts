import type { PointerEvent } from "react";

import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  getRenderedGridItemKey,
  type GridItemConfig,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import {
  getGridGestureDelta,
  type GridDelta,
  hasDelta,
  isGestureOwner,
  type AbstractGridGesture,
} from "@/lib/widgets/layouts/grid/gesture";
import { findItemsOverlap } from "@/lib/widgets/layouts/grid/overlap";
import type GridPreviewArea from "@/lib/widgets/layouts/grid/preview";
import { getDragPreview, type GridPreviewRole } from "@/lib/widgets/layouts/grid/preview";
import { clamp } from "@/lib/utils";

export default interface GridResize extends AbstractGridGesture {
  kind: "resize";
  sides: readonly GridResizeSide[];
}

export function getResizePreview(
  resize: GridResize | undefined,
  deps: GetResizePreviewDeps,
): GridPreviewArea[] {
  if (!resize) return [];
  if (!hasDelta(resize.delta)) return getResizePressPreview(resize, deps);
  return getResizeDragPreview(resize, deps);
}

export interface GetResizePreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

export function getGridResizeDelta(
  resize: GridResize,
  deps: GetGridResizeDeltaDeps,
): GridDelta {
  const axes = new Set(resize.sides.map((side) => RESIZE_SIDES[side].axis));
  const gestureDelta = getGridGestureDelta(resize, deps);

  return {
    rows: axes.has("rows") ? gestureDelta.rows : 0,
    columns: axes.has("columns") ? gestureDelta.columns : 0,
  };
}

export interface GetGridResizeDeltaDeps {
  event: PointerEvent<HTMLElement>;
}

export function getResizedItemConfig(
  resize: GridResize,
  deps: GetResizedItemConfigDeps,
): GridItemConfig {
  const innerDeps = { ...deps, resize };

  const resizedItemConfig = resize.sides.reduce(
    (itemConfig, side) => getItemConfigResizedAtSide(itemConfig, side, innerDeps),
    resize.owner.itemConfig,
  );

  return resizedItemConfig;
}

export interface GetResizedItemConfigDeps {
  grid: GridConfig;
}

function getResizePressPreview(
  resize: GridResize,
  deps: GetResizePressPreviewDeps,
): GridPreviewArea[] {
  const firstStep = getFirstStepItemConfig(resize, deps);
  const innerDeps = { ...deps, resize, firstStep };

  const pressPreview = deps.itemsToRender.map((item) =>
    getItemAreaOnResizePress(item, innerDeps),
  );

  return pressPreview;
}

interface GetResizePressPreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

function getResizeDragPreview(
  resize: GridResize,
  deps: GetResizeDragPreviewDeps,
): GridPreviewArea[] {
  const resizedItemConfig = getResizedItemConfig(resize, deps);

  const innerDeps = {
    ...deps,
    itemConfig: resizedItemConfig,
    ownerRole: "resized" as const,
  };

  return getDragPreview(resize, innerDeps);
}

interface GetResizeDragPreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

function getItemConfigResizedAtSide(
  itemConfig: GridItemConfig,
  side: GridResizeSide,
  deps: GetItemConfigResizedAtSideDeps,
) {
  const geometry = RESIZE_SIDES[side];
  const delta = deps.resize.delta[geometry.axis];
  const innerDeps = { ...deps, geometry, delta };

  return geometry.direction === "forward"
    ? getItemConfigResizedForward(itemConfig, innerDeps)
    : getItemConfigResizedBackward(itemConfig, innerDeps);
}

interface GetItemConfigResizedAtSideDeps {
  resize: GridResize;
  grid: GridConfig;
}

function getFirstStepItemConfig(
  resize: GridResize,
  deps: GetFirstStepItemConfigDeps,
): GridItemConfig {
  const firstStepResize = { ...resize, delta: getOutwardStepDelta(resize) };
  return getResizedItemConfig(firstStepResize, deps);
}

interface GetFirstStepItemConfigDeps {
  grid: GridConfig;
}

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

function getOutwardStepDelta(resize: GridResize): GridDelta {
  const outwardStepDelta = resize.sides.reduce<GridDelta>(
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

interface GetItemRoleOnResizePressDeps {
  resize: GridResize;
  firstStep: GridItemConfig;
}

function isTouchedByFirstStep(item: GridItemToRender, deps: IsTouchedByFirstStepDeps) {
  return Boolean(findItemsOverlap(item.itemConfig, deps.firstStep));
}

interface IsTouchedByFirstStepDeps {
  firstStep: GridItemConfig;
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

export type GridResizeHandleKind = "edge" | "corner";

export interface GridResizeHandleConfig {
  name: string;
  kind: GridResizeHandleKind;
  sides: readonly GridResizeSide[];
  cursor: string;
  handleClass: string;
  gripClass: string;
  activeGripClass: string;
}
