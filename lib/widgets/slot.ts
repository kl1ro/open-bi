import type { AbstractWidgetConfig } from "@/lib/widget";
import type WidgetConfig from "@/lib/widget";

export default interface SlotConfig extends AbstractWidgetConfig {
  type: "slot";
  parentId: WidgetConfig["id"];
  children?: undefined;
}

export function createSlotConfig(parentId: WidgetConfig["id"]): SlotConfig {
  return { id: crypto.randomUUID(), type: "slot", parentId };
}
