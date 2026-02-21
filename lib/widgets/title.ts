import { AbstractWidget } from "../widget";

export interface Title extends AbstractWidget {
  text: string;
  type: "title";
  children?: undefined;
}
