import { AbstractWidget, NonEmptyWidget } from "../widget";

export default interface Void extends Required<
  Pick<AbstractWidget, "id" | "position" | "size">
> {
  type: "void";
  children?: undefined;
  parent?: NonEmptyWidget;
}
