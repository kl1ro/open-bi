import { useState } from "react";

import CreateWidgetDialog from "@/components/dialogs/CreateWidgetDialog";
import { cn } from "@/lib/utils";
import type { ItemConfig } from "@/lib/widget";
import type WidgetConfig from "@/lib/widget";

export default function SlotWidget(props: SlotWidgetProps) {
  const state = useSlotWidgetState();

  return (
    <>
      <button
        onClick={() => state.setIsFormOpen(true)}
        className={cn(
          "size-full",
          "flex justify-center items-center",
          "text-6xl font-bold text-muted-foreground",
          "bg-medium hover:bg-light rounded-xl select-none cursor-pointer",
          "animated",
        )}
      >
        +
      </button>
      <CreateWidgetDialog
        open={state.isFormOpen}
        setOpen={state.setIsFormOpen}
        id={props.id}
        parentId={props.parentId}
        itemConfig={props.itemConfig}
      />
    </>
  );
}

export interface SlotWidgetProps {
  id?: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
  itemConfig?: ItemConfig;
}

function useSlotWidgetState() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  return { isFormOpen, setIsFormOpen };
}
