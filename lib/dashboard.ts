import type WidgetConfig from "@/lib/widget";
import type { WidgetConfigsById } from "@/lib/widget";

export default interface DashboardConfig {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}
