import { AbstractGraph } from "../graph";

export interface LineGraph extends AbstractGraph {
  graph: "line";
  children?: undefined;
}
