import { GripHorizontalIcon } from "lucide-react";

import { isGestureOwner } from "@/lib/widgets/layouts/grid/gesture";
import type { GridItemToRender } from "@/lib/widgets/layouts/grid";
import { cn } from "@/lib/utils";
import type { UseGridGestureInterface } from "@/hooks/grid/useGridGesture";

export default function GridMoveHandle(props: GridMoveHandleProps) {
  if (!props.item.id) return;
  const isActive = isGestureOwner(props.item, props.gesture.move.value);

  return (
    <div
      className={cn(
        "absolute z-10 top-4 left-1/2 -translate-x-1/2 pointer-events-auto touch-none",
        "flex items-center justify-center cursor-grab",
        "opacity-0 group-hover/item:opacity-100 animated",
        isActive && "opacity-100 cursor-grabbing",
      )}
      onPointerDown={(event) => props.gesture.move.tryStart({ ...props, event })}
      onPointerMove={(event) => props.gesture.move.continue({ event })}
      onPointerUp={(event) => props.gesture.move.tryFinish({ event })}
      onPointerCancel={props.gesture.move.reset}
    >
      <GripHorizontalIcon
        className={cn(MOVE_GRIP_CLASS, isActive && MOVE_ACTIVE_GRIP_CLASS)}
      />
    </div>
  );
}

export interface GridMoveHandleProps {
  item: GridItemToRender;
  gesture: UseGridGestureInterface;
}

const MOVE_GRIP_CLASS = "size-6 text-medium hover:text-blue-700 animated";
const MOVE_ACTIVE_GRIP_CLASS = "text-blue-700";
