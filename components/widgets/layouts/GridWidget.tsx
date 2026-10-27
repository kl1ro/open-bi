import { type ReactNode, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, type MotionProps } from "framer-motion";
import { toast } from "sonner";

import Widget from "@/components/Widget";
import SlotWidget from "@/components/widgets/SlotWidget";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  getGridConfigWithAdoptedChild,
  getGridItemConfig,
  getGridItemsToRender,
  isGridItemCollapsed,
  type GridItemToRender,
  type GridItemConfig,
  findItemsOverlap,
  getRenderedGridItemKey,
  hasDelta,
  type GridResizeDelta,
  haveSameDelta,
  occupySameCells,
} from "@/lib/widgets/layouts/grid";
import { findWidgetConfig } from "@/lib/widget";
import type WidgetConfig from "@/lib/widget";
import { clamp, cn } from "@/lib/utils";
import { upsertWidget } from "@/state/features/dashboard";
import { useAppStore } from "@/state/hooks";
import {
  combineAnimations,
  FADE_IN_OUT_ANIMATION,
  SOFT_RESIZE_ANIMATION,
  SPRING_RESIZE_ANIMATION,
} from "@/lib/animation";
import { createSlotConfig } from "@/lib/widgets/slot";

export default function GridWidget(props: GridConfig) {
  const state = useGridWidgetState(props);

  return (
    <div
      ref={state.container}
      data-resizing={state.resize.value ? "" : undefined}
      className="group/grid size-full grid gap-8 grid-rows-(--rows) grid-cols-(--cols) relative"
      style={getGridTemplateStyle(state.grid)}
    >
      <AnimatePresence initial={false}>
        {state.itemsToRender.map((item) => (
          <GridItem key={getRenderedGridItemKey(item)} item={item} gridState={state} />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {state.resize.preview.map((area) => (
          <ResizePreviewHighlight key={area.key} area={area} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function useGridWidgetState(props: GridConfig) {
  const itemsToRender = getGridItemsToRender(props);

  return {
    grid: props,
    itemsToRender,
    container: useRef<HTMLDivElement>(null),
    store: useAppStore(),
    resize: useGridResize({ grid: props, itemsToRender }),
  };
}

type GridWidgetState = ReturnType<typeof useGridWidgetState>;

function getGridTemplateStyle(grid: GridConfig) {
  return {
    "--rows": `repeat(${grid.rows}, minmax(0, 1fr))`,
    "--cols": `repeat(${grid.columns}, minmax(0, 1fr))`,
  };
}

function GridItem(props: GridItemProps) {
  return (
    <GridArea
      itemConfig={props.item.itemConfig}
      animations={[FADE_IN_OUT_ANIMATION, SPRING_RESIZE_ANIMATION]}
      className="relative group/item"
    >
      <div className="size-full transition-opacity duration-350 group-data-resizing/grid:opacity-15 group-data-resizing/grid:pointer-events-none">
        <GridItemContent item={props.item} parentId={props.gridState.grid.id} />
      </div>

      <GridResizeHandles item={props.item} gridState={props.gridState} />
    </GridArea>
  );
}

interface GridItemProps {
  item: GridItemToRender;
  gridState: GridWidgetState;
}

function ResizePreviewHighlight(props: ResizePreviewHighlightProps) {
  return (
    <GridArea
      itemConfig={props.area.itemConfig}
      animations={[FADE_IN_OUT_ANIMATION, SOFT_RESIZE_ANIMATION]}
      className={cn(
        "z-20 rounded-xl ring-2 ring-inset pointer-events-none transition-[box-shadow,background-color] duration-350",
        PREVIEW_ROLE_CLASSES[props.area.role],
      )}
    />
  );
}

interface ResizePreviewHighlightProps {
  area: GridResizePreviewArea;
}

const PREVIEW_ROLE_CLASSES = {
  focused: "ring-blue-700",
  resized: "ring-blue-700",
  affected: "ring-blue-900",
  eaten: "ring-red-600 bg-red-600/10",
  unaffected: "ring-neutral-500",
} as const satisfies { [Role in GridResizePreviewRole]: string };

function useGridResize(deps: UseGridResizeDeps) {
  const [value, set] = useState<GridResize>();
  return { value, set, preview: getResizePreview(value, deps) };
}

interface UseGridResizeDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

function GridArea(props: GridAreaProps) {
  return (
    <motion.div
      {...combineAnimations(props.animations)}
      style={getGridAreaStyle(props.itemConfig)}
      className={cn(GRID_AREA_CLASS, props.className)}
    >
      {props.children}
    </motion.div>
  );
}

interface GridAreaProps {
  itemConfig: GridItemConfig;
  animations?: readonly MotionProps[];
  className?: string;
  children?: ReactNode;
}

const GRID_AREA_CLASS =
  "row-start-(--row-start) col-start-(--col-start) row-span-(--row-span) col-span-(--col-span)";

function GridItemContent(props: GridItemContentProps) {
  if (!props.item.id)
    return <SlotWidget parentId={props.parentId} itemConfig={props.item.itemConfig} />;

  return <Widget id={props.item.id} />;
}

interface GridItemContentProps {
  item: GridItemToRender;
  parentId: WidgetConfig["id"];
}

function GridResizeHandles(props: GridResizeHandlesProps) {
  return RESIZE_HANDLES.map((handle) => (
    <GridResizeHandle
      key={handle.name}
      handle={handle}
      item={props.item}
      gridState={props.gridState}
    />
  ));
}

interface GridResizeHandlesProps {
  item: GridItemToRender;
  gridState: GridWidgetState;
}

function getResizePreview(
  resize: GridResize | undefined,
  deps: GetResizePreviewDeps,
): GridResizePreviewArea[] {
  if (!resize) return [];
  if (!hasDelta(resize.delta)) return getPressPreview(resize, deps);
  return getDragPreview(resize, deps);
}

interface GetResizePreviewDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
}

function getGridAreaStyle(itemConfig: GridItemConfig) {
  return {
    "--row-span": itemConfig.size.rowSpan,
    "--col-span": itemConfig.size.colSpan,
    "--row-start": itemConfig.position.row,
    "--col-start": itemConfig.position.column,
  };
}

function GridResizeHandle(props: GridResizeHandleProps) {
  const isActive = isResizeOwner(props.item, props.gridState.resize.value);

  return (
    <div
      className={cn(
        "absolute z-10 pointer-events-auto touch-none flex items-center justify-center",
        "opacity-0 group-hover/item:opacity-100 animated",
        props.handle.handleClass,
        props.handle.cursor,
        isActive && "opacity-100",
      )}
      onPointerDown={(event) => startResize({ ...props, event })}
      onPointerMove={(event) => continueResize({ ...props.gridState, event })}
      onPointerUp={(event) => tryFinishResize({ ...props.gridState, event })}
      onPointerCancel={() => resetResize(props.gridState)}
    >
      <ResizeGrip
        kind={props.handle.kind}
        className={cn(props.handle.gripClass, isActive && props.handle.activeGripClass)}
      />
    </div>
  );
}

interface GridResizeHandleProps {
  handle: GridResizeHandleConfig;
  item: GridItemToRender;
  gridState: GridWidgetState;
}

function getPressPreview(
  resize: GridResize,
  deps: GetPressPreviewDeps,
): GridResizePreviewArea[] {
  const firstStep = getFirstStepItemConfig(resize, deps);
  const itemAreaDeps = { resize, firstStep };
  return deps.itemsToRender.map((item) => getItemAreaOnPress(item, itemAreaDeps));
}

type GetPressPreviewDeps = GetResizePreviewDeps;

function getDragPreview(
  resize: GridResize,
  deps: GetDragPreviewDeps,
): GridResizePreviewArea[] {
  const resizedItemConfig = getResizedItemConfig(resize, deps);

  const previewGrid = getGridConfigWithAdoptedChild(
    deps.grid,
    resize.owner.child,
    resizedItemConfig,
  );

  const itemAreaDeps = { resize, previewGrid };

  return deps.itemsToRender.flatMap(
    (item) => findItemAreaOnDrag(item, itemAreaDeps) ?? [],
  );
}

type GetDragPreviewDeps = GetResizePreviewDeps;

function isResizeOwner(item: GridItemToRender, resize: GridResize | undefined) {
  return resize?.owner.key == getRenderedGridItemKey(item);
}

function startResize(deps: StartResizeDeps) {
  const owner = findResizeOwner(deps.item, deps.gridState);
  const container = deps.gridState.container.current;
  if (!owner || !container) return;

  takeOverPointerEvent(deps.event);

  deps.gridState.resize.set({
    owner,
    handle: deps.handle,
    startPoint: { clientX: deps.event.clientX, clientY: deps.event.clientY },
    cellPitch: measureCellPitch(container, deps.gridState),
    delta: { rows: 0, columns: 0 },
  });
}

interface StartResizeDeps {
  event: PointerEvent<HTMLElement>;
  handle: GridResizeHandleConfig;
  item: GridItemToRender;
  gridState: GridWidgetState;
}

function continueResize(deps: ContinueResizeDeps) {
  if (!deps.resize.value) return;
  const delta = getGridResizeDelta(deps.resize.value, deps);
  if (haveSameDelta(delta, deps.resize.value.delta)) return;
  deps.resize.set({ ...deps.resize.value, delta });
}

type ContinueResizeDeps = Pick<GridWidgetState, "resize"> & {
  event: PointerEvent<HTMLElement>;
};

function tryFinishResize(deps: TryFinishResizeDeps) {
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

type TryFinishResizeDeps = Pick<GridWidgetState, "resize" | "grid" | "store"> & {
  event: PointerEvent<HTMLElement>;
};

function resetResize(deps: ResetResizeDeps) {
  deps.resize.set(undefined);
}

type ResetResizeDeps = Pick<GridWidgetState, "resize">;

function ResizeGrip(props: ResizeGripProps) {
  switch (props.kind) {
    case "edge":
      return <div className={props.className} />;

    case "corner":
      return <CornerGrip className={props.className} />;

    default:
      throw getUnexpectedGridResizeHandleKindError(props.kind);
  }
}

interface ResizeGripProps {
  kind: GridResizeHandleKind;
  className: string;
}

function getFirstStepItemConfig(
  resize: GridResize,
  deps: GetFirstStepItemConfigDeps,
): GridItemConfig {
  const firstStepResize = { ...resize, delta: getOutwardStepDelta(resize.handle) };
  return getResizedItemConfig(firstStepResize, deps);
}

type GetFirstStepItemConfigDeps = Pick<GetPressPreviewDeps, "grid">;

function getItemAreaOnPress(
  item: GridItemToRender,
  deps: GetItemAreaOnPressDeps,
): GridResizePreviewArea {
  return {
    key: getRenderedGridItemKey(item),
    itemConfig: item.itemConfig,
    role: getItemRoleOnPress(item, deps),
  };
}

interface GetItemAreaOnPressDeps {
  resize: GridResize;
  firstStep: GridItemConfig;
}

function getResizedItemConfig(
  resize: GridResize,
  deps: GetResizedItemConfigDeps,
): GridItemConfig {
  return resize.handle.sides.reduce(
    (itemConfig, side) =>
      getItemConfigResizedAtSide(itemConfig, side, { resize, grid: deps.grid }),
    resize.owner.itemConfig,
  );
}

interface GetResizedItemConfigDeps {
  grid: GridConfig;
}

function findItemAreaOnDrag(
  item: GridItemToRender,
  deps: FindItemAreaOnDragDeps,
): GridResizePreviewArea | undefined {
  if (isResizeOwner(item, deps.resize)) return getOwnerArea(deps);

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
  resize: GridResize;
  previewGrid: GridConfig;
}

function findResizeOwner(
  item: GridItemToRender,
  deps: FindResizeOwnerDeps,
): GridResizeOwner | undefined {
  const widgetConfigsDeps = {
    widgetConfigs: deps.store.getState().dashboard.widgetConfigs,
  };

  const child = item.id
    ? findWidgetConfig(item.id, widgetConfigsDeps)
    : createSlotConfig(deps.grid.id);

  if (!child) return;
  return { key: getRenderedGridItemKey(item), child, itemConfig: item.itemConfig };
}

type FindResizeOwnerDeps = Pick<GridWidgetState, "grid" | "store">;

function takeOverPointerEvent(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
}

function measureCellPitch(
  container: HTMLElement,
  deps: MeasureCellPitchDeps,
): GridCellPitch {
  const style = getComputedStyle(container);

  return {
    width: (container.clientWidth + parseFloat(style.columnGap)) / deps.grid.columns,
    height: (container.clientHeight + parseFloat(style.rowGap)) / deps.grid.rows,
  };
}

interface MeasureCellPitchDeps {
  grid: GridConfig;
}

function getGridResizeDelta(
  resize: GridResize,
  deps: GetGridResizeDeltaDeps,
): GridResizeDelta {
  const axes = new Set(resize.handle.sides.map((side) => RESIZE_SIDES[side].axis));

  const [rows, columns] = [
    (deps.event.clientY - resize.startPoint.clientY) / resize.cellPitch.height,
    (deps.event.clientX - resize.startPoint.clientX) / resize.cellPitch.width,
  ];

  return {
    rows: axes.has("rows") ? Math.round(rows) : 0,
    columns: axes.has("columns") ? Math.round(columns) : 0,
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

function CornerGrip(props: CornerGripProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 fill-none stroke-current", props.className)}
    >
      <path d="M4 20 V12 A8 8 0 0 1 12 4 H20" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

interface CornerGripProps {
  className: string;
}

function getUnexpectedGridResizeHandleKindError(kind: never) {
  return kind
    ? new NonexistentGridResizeHandleKindError({ kind })
    : new NoGridResizeHandleKindError();
}

export class NoGridResizeHandleKindError extends Error {
  public name = NoGridResizeHandleKindError.name;

  public constructor(options?: ErrorOptions) {
    super(`Grid resize handle has no kind`, options);
  }
}

export class NonexistentGridResizeHandleKindError extends Error {
  public name = NonexistentGridResizeHandleKindError.name;
  public kind: unknown;

  public constructor(options: ErrorOptions & { kind: unknown }) {
    super(`Grid resize handle kind ${options.kind as string} does not exist`, options);
    this.kind = options.kind;
  }
}

function getOutwardStepDelta(handle: GridResizeHandleConfig): GridResizeDelta {
  return handle.sides.reduce<GridResizeDelta>(
    (delta, side) => {
      const geometry = RESIZE_SIDES[side];
      return { ...delta, [geometry.axis]: geometry.direction == "forward" ? 1 : -1 };
    },
    { rows: 0, columns: 0 },
  );
}

function getItemRoleOnPress(
  item: GridItemToRender,
  deps: GetItemRoleOnPressDeps,
): GridResizePreviewRole {
  if (isResizeOwner(item, deps.resize)) return "focused";
  return isTouchedByFirstStep(item, deps) ? "affected" : "unaffected";
}

type GetItemRoleOnPressDeps = GetItemAreaOnPressDeps;

function getItemConfigResizedAtSide(
  itemConfig: GridItemConfig,
  side: GridResizeSide,
  deps: GetItemConfigResizedAtSideDeps,
) {
  const geometry = RESIZE_SIDES[side];
  const delta = deps.resize.delta[geometry.axis];
  const sideDeps = { geometry, delta, grid: deps.grid };

  return geometry.direction == "forward"
    ? getItemConfigResizedForward(itemConfig, sideDeps)
    : getItemConfigResizedBackward(itemConfig, sideDeps);
}

interface GetItemConfigResizedAtSideDeps {
  resize: GridResize;
  grid: GridConfig;
}

function getOwnerArea(deps: GetOwnerAreaDeps): GridResizePreviewArea {
  const { owner } = deps.resize;
  const previewItemConfig = getOwnerPreviewItemConfig(deps);

  if (isGridItemCollapsed(previewItemConfig))
    return { key: owner.key, itemConfig: owner.itemConfig, role: "eaten" };

  return { key: owner.key, itemConfig: previewItemConfig, role: "resized" };
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
): GridResizePreviewArea | undefined {
  if (findItemsOverlap(item.itemConfig, getOwnerPreviewItemConfig(deps))) return;

  return {
    key: getRenderedGridItemKey(item),
    itemConfig: item.itemConfig,
    role: "unaffected",
  };
}

type FindComputedSlotAreaOnDragDeps = FindItemAreaOnDragDeps;

function isTouchedByFirstStep(item: GridItemToRender, deps: IsTouchedByFirstStepDeps) {
  return Boolean(findItemsOverlap(item.itemConfig, deps.firstStep));
}

type IsTouchedByFirstStepDeps = Pick<GetItemRoleOnPressDeps, "firstStep">;

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

function getOwnerPreviewItemConfig(deps: GetOwnerPreviewItemConfigDeps) {
  return getGridItemConfig(deps.previewGrid, deps.resize.owner.child);
}

type GetOwnerPreviewItemConfigDeps = FindItemAreaOnDragDeps;

interface GridResize {
  owner: GridResizeOwner;
  handle: GridResizeHandleConfig;
  startPoint: { clientX: number; clientY: number };
  cellPitch: GridCellPitch;
  delta: GridResizeDelta;
}

interface GridResizeOwner {
  key: string;
  child: WidgetConfig;
  itemConfig: GridItemConfig;
}

interface GridCellPitch {
  width: number;
  height: number;
}

interface GridResizePreviewArea {
  key: string;
  itemConfig: GridItemConfig;
  role: GridResizePreviewRole;
}

type GridResizePreviewRole = "focused" | "resized" | "affected" | "eaten" | "unaffected";

type GridResizeSide = "top" | "bottom" | "left" | "right";

const RESIZE_SIDES = {
  top: { axis: "rows", direction: "backward", position: "row", span: "rowSpan" },
  bottom: { axis: "rows", direction: "forward", position: "row", span: "rowSpan" },
  left: { axis: "columns", direction: "backward", position: "column", span: "colSpan" },
  right: { axis: "columns", direction: "forward", position: "column", span: "colSpan" },
} as const satisfies { [Side in GridResizeSide]: GridResizeSideGeometry };

interface GridResizeSideGeometry {
  axis: keyof GridResizeDelta;
  direction: "forward" | "backward";
  position: keyof GridItemConfig["position"];
  span: keyof GridItemConfig["size"];
}

const EDGE_GRIP_CLASS = "rounded-full bg-medium hover:bg-blue-700 animated";
const EDGE_ACTIVE_GRIP_CLASS = "bg-blue-700";

const CORNER_GRIP_CLASS = "text-medium hover:text-blue-700 animated";
const CORNER_ACTIVE_GRIP_CLASS = "text-blue-700";

const RESIZE_HANDLES = [
  {
    name: "top",
    kind: "edge",
    sides: ["top"],
    cursor: "cursor-row-resize",
    handleClass: "top-1.5 inset-x-8 h-2",
    gripClass: cn(EDGE_GRIP_CLASS, "h-1.5 w-1/4"),
    activeGripClass: EDGE_ACTIVE_GRIP_CLASS,
  },
  {
    name: "bottom",
    kind: "edge",
    sides: ["bottom"],
    cursor: "cursor-row-resize",
    handleClass: "bottom-1.5 inset-x-8 h-2",
    gripClass: cn(EDGE_GRIP_CLASS, "h-1.5 w-1/4"),
    activeGripClass: EDGE_ACTIVE_GRIP_CLASS,
  },
  {
    name: "left",
    kind: "edge",
    sides: ["left"],
    cursor: "cursor-col-resize",
    handleClass: "left-1.5 inset-y-8 w-2",
    gripClass: cn(EDGE_GRIP_CLASS, "w-1.5 h-1/4"),
    activeGripClass: EDGE_ACTIVE_GRIP_CLASS,
  },
  {
    name: "right",
    kind: "edge",
    sides: ["right"],
    cursor: "cursor-col-resize",
    handleClass: "right-1.5 inset-y-8 w-2",
    gripClass: cn(EDGE_GRIP_CLASS, "w-1.5 h-1/4"),
    activeGripClass: EDGE_ACTIVE_GRIP_CLASS,
  },
  {
    name: "top-left",
    kind: "corner",
    sides: ["top", "left"],
    cursor: "cursor-nwse-resize",
    handleClass: "top-1 left-1 size-6",
    gripClass: CORNER_GRIP_CLASS,
    activeGripClass: CORNER_ACTIVE_GRIP_CLASS,
  },
  {
    name: "top-right",
    kind: "corner",
    sides: ["top", "right"],
    cursor: "cursor-nesw-resize",
    handleClass: "top-1 right-1 size-6",
    gripClass: cn(CORNER_GRIP_CLASS, "rotate-90"),
    activeGripClass: CORNER_ACTIVE_GRIP_CLASS,
  },
  {
    name: "bottom-right",
    kind: "corner",
    sides: ["bottom", "right"],
    cursor: "cursor-nwse-resize",
    handleClass: "bottom-1 right-1 size-6",
    gripClass: cn(CORNER_GRIP_CLASS, "rotate-180"),
    activeGripClass: CORNER_ACTIVE_GRIP_CLASS,
  },
  {
    name: "bottom-left",
    kind: "corner",
    sides: ["bottom", "left"],
    cursor: "cursor-nesw-resize",
    handleClass: "bottom-1 left-1 size-6",
    gripClass: cn(CORNER_GRIP_CLASS, "-rotate-90"),
    activeGripClass: CORNER_ACTIVE_GRIP_CLASS,
  },
] as const satisfies readonly GridResizeHandleConfig[];

type GridResizeHandleKind = "edge" | "corner";

interface GridResizeHandleConfig {
  name: string;
  kind: GridResizeHandleKind;
  sides: readonly GridResizeSide[];
  cursor: string;
  handleClass: string;
  gripClass: string;
  activeGripClass: string;
}
