import { GripHorizontalIcon } from "lucide-react";

import type { GridWidgetState } from "@/components/widgets/layouts/GridWidget";
import { isGestureOwner } from "@/hooks/grid/gesture";
import type { GridItemToRender } from "@/lib/widgets/layouts/grid";
import { cn } from "@/lib/utils";

export default function GridMoveHandle(props: GridMoveHandleProps) {
  if (!props.item.id) return;
  const isActive = isGestureOwner(props.item, props.gridState.move.value);

  return (
    <div
      className={cn(
        "absolute z-10 top-4 left-1/2 -translate-x-1/2 pointer-events-auto touch-none",
        "flex items-center justify-center cursor-grab",
        "opacity-0 group-hover/item:opacity-100 animated",
        isActive && "opacity-100 cursor-grabbing",
      )}
      onPointerDown={(event) => props.gridState.move.start({ ...props, event })}
      onPointerMove={props.gridState.move.continue}
      onPointerUp={props.gridState.move.finish}
      onPointerCancel={props.gridState.move.reset}
    >
      <GripHorizontalIcon
        className={cn(MOVE_GRIP_CLASS, isActive && MOVE_ACTIVE_GRIP_CLASS)}
      />
    </div>
  );
}

export interface GridMoveHandleProps {
  item: GridItemToRender;
  gridState: GridWidgetState;
}

const MOVE_GRIP_CLASS = "size-6 text-medium hover:text-blue-700 animated";
const MOVE_ACTIVE_GRIP_CLASS = "text-blue-700";
