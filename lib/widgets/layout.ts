import Widget, { AbstractWidget, NonEmptyWidget } from "./widget";

type Layout = Grid | Absolute | Flex;
export default Layout;

export interface Grid extends AbstractLayout {
  layout: "grid";
  rows: number;
  columns: number;
}

export interface Absolute extends AbstractLayout {
  layout: "absolute";
}

export interface Flex extends AbstractLayout {
  layout: "flex";
  direction: FlexDirection;
  gap?: number;
}

export type FlexDirection = "row" | "column";

export interface AbstractLayout extends AbstractWidget {
  type: "layout";
  layout: LayoutType;
  parent?: NonEmptyWidget;
  children: Widget[];
}

export type LayoutType = "grid" | "flex" | "absolute";
