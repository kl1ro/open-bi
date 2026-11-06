import type { PointerEvent, RefObject } from "react";
import type GridConfig from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import type { GridItemConfig } from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import type WidgetConfig from "@kl1ro/mip-bi-core/widget";
import { getWidgetConfig, type WidgetConfigsById } from "@kl1ro/mip-bi-core/widget";
import { createSlotConfig } from "@kl1ro/mip-bi-core/widgets/slot";

import {
  getRenderedGridItemKey,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import type GridMove from "@/lib/widgets/layouts/grid/move";
import type GridResize from "@/lib/widgets/layouts/grid/resize";

type GridGesture = GridResize | GridMove;

export default GridGesture;

export function isGestureInProgress(gesture: GridGesture | undefined) {
  return Boolean(gesture);
}

export function isGestureOwner(
  item: GridItemToRender,
  gesture: AbstractGridGesture | undefined,
) {
  return gesture?.owner.key === getRenderedGridItemKey(item);
}

export function createGesture(deps: CreateGestureDeps): AbstractGridGesture {
  const container = getGridContainer(deps);
  const innerDeps = { ...deps, container };

  return {
    owner: getGestureOwner(deps.item, innerDeps),
    startPoint: { clientX: deps.event.clientX, clientY: deps.event.clientY },
    cellPitch: measureCellPitch(innerDeps),
    delta: { rows: 0, columns: 0 },
  };
}

export interface CreateGestureDeps {
  event: PointerEvent<HTMLElement>;
  item: GridItemToRender;
  grid: GridConfig;
  container: RefObject<HTMLDivElement | null>;
  widgetConfigs: WidgetConfigsById;
}

export function getGesturePointerDelta(
  gesture: AbstractGridGesture,
  event: PointerEvent<HTMLElement>,
): GridDelta {
  const [rows, columns] = [
    (event.clientY - gesture.startPoint.clientY) / gesture.cellPitch.height,
    (event.clientX - gesture.startPoint.clientX) / gesture.cellPitch.width,
  ];

  return { rows: Math.round(rows), columns: Math.round(columns) };
}

function getGridContainer(deps: GetGridContainerDeps) {
  const container = deps.container.current;
  if (!container) throw new GridContainerNotMountedError();
  return container;
}

interface GetGridContainerDeps {
  container: RefObject<HTMLDivElement | null>;
}

export class GridContainerNotMountedError extends Error {
  public name = GridContainerNotMountedError.name;

  public constructor(options?: ErrorOptions) {
    super("Grid container is not mounted", options);
  }
}

function getGestureOwner(
  item: GridItemToRender,
  deps: GetGestureOwnerDeps,
): GridGestureOwner {
  const child = item.id ? getWidgetConfig(item.id, deps) : createSlotConfig(deps.grid.id);
  return { key: getRenderedGridItemKey(item), child, itemConfig: item.itemConfig };
}

interface GetGestureOwnerDeps {
  grid: GridConfig;
  widgetConfigs: WidgetConfigsById;
}

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

export function hasDelta(delta: GridDelta) {
  return delta.rows !== 0 || delta.columns !== 0;
}

export function haveSameDelta(first: GridDelta, second: GridDelta) {
  return first.rows === second.rows && first.columns === second.columns;
}

export interface AbstractGridGesture {
  owner: GridGestureOwner;
  startPoint: { clientX: number; clientY: number };
  cellPitch: GridCellPitch;
  delta: GridDelta;
}

export interface GridDelta {
  rows: number;
  columns: number;
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
