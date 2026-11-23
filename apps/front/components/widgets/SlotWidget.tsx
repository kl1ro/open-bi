import { useState } from "react";
import type SlotConfig from "@kl1ro/mip-bi-core/widgets/slot";
import type WidgetConfig from "@kl1ro/mip-bi-core/widget";
import type { ItemConfig } from "@kl1ro/mip-bi-core/widget";

import CreateWidgetDialog from "@/components/dialogs/CreateWidgetDialog";
import { cn } from "@/lib/utils";

export default function SlotWidget(props: SlotWidgetProps) {
  const state = useSlotWidgetState();

  return (
    <>
      <button
        onClick={() => state.isFormOpen.set(true)}
        aria-label="Добавить виджет"
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
        open={state.isFormOpen.value}
        setOpen={state.isFormOpen.set}
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
  return {
    isFormOpen: useIsFormOpen(),
  };
}

function useIsFormOpen() {
  const [value, set] = useState(false);
  return { value, set };
}
