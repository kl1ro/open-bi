import type { AbstractGraphConfig } from "../graph";

export default interface LineGraphConfig extends AbstractGraphConfig {
  graph: "line";
  children?: undefined;
}
