import Widget, { AbstractWidget, NonEmptyWidget } from "../widget";
import Absolute from "./layouts/absolute";
import Flex from "./layouts/flex";
import Grid, { fillGridWithVoids } from "./layouts/grid";

type Layout = Grid | Absolute | Flex;

export default Layout;

export function fillLayoutWithVoids(layout: Layout): Layout {
  switch (layout.layout) {
    case "grid":
      return fillGridWithVoids(layout);
    default:
      return layout;
  }
}

export interface AbstractLayout extends AbstractWidget {
  type: "layout";
  layout: LayoutType;
  parent?: NonEmptyWidget;
  children?: Widget[];
}

export type LayoutType = "grid" | "flex" | "absolute";
