import type { AbstractWidgetConfig } from "@/lib/widget";

export default interface TitleConfig extends AbstractWidgetConfig {
  type: "title";
  text: string;
  children?: undefined;
}
