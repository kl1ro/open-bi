import Layout, { prepareLayout } from "./widgets/layout";
import Void from "./widgets/void";

type Widget = Layout | Void;

export default Widget;

export function prepareWidget(widget: NonEmptyWidget): NonEmptyWidget {
  switch (widget.type) {
    case "layout":
      return prepareLayout(widget);
    default:
      return widget;
  }
}

export type NonEmptyWidget = Exclude<Widget, Void>;

export interface AbstractWidget {
  id: string;
  type: WidgetType;
  parent?: NonEmptyWidget;
}

export const WIDGET_TYPE = {
  void: "void",
  layout: "layout",
} as const;

export type WidgetType = keyof typeof WIDGET_TYPE;
export type NonEmptyWidgetType = Exclude<WidgetType, "void">;
