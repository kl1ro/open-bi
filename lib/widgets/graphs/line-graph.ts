import type { AbstractGraphConfig } from "@/lib/widgets/graph";

export default interface LineGraphConfig extends AbstractGraphConfig {
  graph: "line";
  children?: undefined;
}
