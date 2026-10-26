import type { AbstractWidgetConfig } from "@/lib/widget";
import type LineGraphConfig from "@/lib/widgets/graphs/line-graph";

type GraphConfig = LineGraphConfig;
export default GraphConfig;

export interface AbstractGraphConfig extends AbstractWidgetConfig {
  type: "graph";
  graph: GraphType;
}

export type GraphType = "line";
