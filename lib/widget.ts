import Layout, { fillLayoutWithVoids } from "./widgets/layout";
import Void from "./widgets/void";

type Widget = Layout | Void;

export default Widget;

export function prepareWidget(widget: Widget): Widget {
  if (widget.type == "layout") return fillLayoutWithVoids(widget);
  return widget;
}

export type NonEmptyWidget = Exclude<Widget, Void>;

export interface AbstractWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  size: WidgetSize;
  parent?: NonEmptyWidget;
}

export const WIDGET_TYPE = {
  void: "void",
  layout: "layout",
} as const;

export type WidgetType = keyof typeof WIDGET_TYPE;
export type NonEmptyWidgetType = Exclude<WidgetType, "void">;

export interface WidgetPosition {
  row: number;
  column: number;
}

export interface WidgetSize {
  rowSpan: number;
  colSpan: number;
}

export const DEFAULT_WIDGET_POSITION = {
  row: 0,
  column: 0,
};
