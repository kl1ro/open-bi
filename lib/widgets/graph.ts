import { AbstractWidget } from "../widget";
import { LineGraph } from "./graphs/line-graph";

export type Graph = LineGraph;
export default Graph;

export interface AbstractGraph extends AbstractWidget {
  type: "graph";
  graph: GraphType;
  children?: undefined;
}

export type GraphType = "line";
