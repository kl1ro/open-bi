import { AbstractWidget, NonEmptyWidget } from "../widget";
import Absolute from "./layouts/absolute";
import Flex from "./layouts/flex";
import Grid, { fillGridWithVoids, generateGridMap } from "./layouts/grid";

type Layout = Grid | Absolute | Flex;

export default Layout;

export function prepareLayout(layout: Layout): Layout {
  switch (layout.layout) {
    case "grid": {
      fillGridWithVoids(layout);
      layout.childrenMap = generateGridMap(layout);
      return layout;
    }
    default:
      return layout;
  }
}

export interface AbstractLayout extends AbstractWidget {
  type: "layout";
  layout: LayoutType;
  parent?: NonEmptyWidget;
}

export type LayoutType = "grid" | "flex" | "absolute";
