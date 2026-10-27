import type { GridWidgetState } from "@/components/widgets/layouts/GridWidget";
import type { GridItemToRender } from "@/lib/widgets/layouts/grid";
import { isGestureOwner } from "@/lib/widgets/layouts/grid/gesture";
import type { GridResizeSide } from "@/lib/widgets/layouts/grid/resize";
import { cn } from "@/lib/utils";

export default function GridResizeHandles(props: GridResizeHandlesProps) {
  return RESIZE_HANDLES.map((handle) => (
    <GridResizeHandle
      key={handle.name}
      handle={handle}
      item={props.item}
      gridState={props.gridState}
    />
  ));
}

export interface GridResizeHandlesProps {
  item: GridItemToRender;
  gridState: GridWidgetState;
}

function GridResizeHandle(props: GridResizeHandleProps) {
  const isActive = isGestureOwner(props.item, props.gridState.resize.value);

  return (
    <div
      className={cn(
        "absolute z-10 pointer-events-auto touch-none flex items-center justify-center",
        "opacity-0 group-hover/item:opacity-100 animated",
        props.handle.handleClass,
        props.handle.cursor,
        isActive && "opacity-100",
      )}
      onPointerDown={(event) => props.gridState.resize.tryStart({ ...props, event })}
      onPointerMove={props.gridState.resize.continue}
      onPointerUp={props.gridState.resize.tryFinish}
      onPointerCancel={props.gridState.resize.reset}
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
    super(`Grid resize handle kind ${String(options.kind)} does not exist`, options);
    this.kind = options.kind;
  }
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
