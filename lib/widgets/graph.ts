import type { AbstractWidgetConfig } from "../widget";
import LineGraphConfig from "./graphs/line-graph";

type GraphConfig = LineGraphConfig;
export default GraphConfig;

export interface AbstractGraphConfig extends AbstractWidgetConfig {
  type: "graph";
  graph: GraphType;
}

export type GraphType = "line";
