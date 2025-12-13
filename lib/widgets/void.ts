import { AbstractWidget, NonEmptyWidget } from "./widget";

export default interface Void extends Required<
  Pick<AbstractWidget, "position" | "size">
> {
  id?: undefined;
  type?: undefined;
  children?: undefined;
  parent?: NonEmptyWidget;
}
