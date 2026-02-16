import Widget, { AbstractWidget } from "../widget";

export default interface Void extends Required<Pick<AbstractWidget, "id">> {
  type: "void";
  children?: undefined;
  parent?: Widget;
}
