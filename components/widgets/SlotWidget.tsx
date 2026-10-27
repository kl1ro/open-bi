import { useState } from "react";

import CreateWidgetDialog from "@/components/dialogs/CreateWidgetDialog";
import { cn } from "@/lib/utils";
import type SlotConfig from "@/lib/widgets/slot";
import type WidgetConfig from "@/lib/widget";
import type { ItemConfig } from "@/lib/widget";

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

export type SlotWidgetProps =
  | StoredSlotWidgetProps
  | ComputedRootSlotWidgetProps
  | ComputedChildSlotWidgetProps;

export interface StoredSlotWidgetProps extends SlotConfig {
  itemConfig?: undefined;
}

export interface ComputedRootSlotWidgetProps {
  id?: undefined;
  parentId?: undefined;
  itemConfig?: undefined;
}

export interface ComputedChildSlotWidgetProps {
  id?: undefined;
  parentId: WidgetConfig["id"];
  itemConfig: ItemConfig;
}

function useSlotWidgetState() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  return { isFormOpen, setIsFormOpen };
}
