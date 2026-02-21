import Graph from "./widgets/graph";
import Layout, { prepareLayout } from "./widgets/layout";
import { Title } from "./widgets/title";
import Void from "./widgets/void";
import Map from "./widgets/map";

type Widget = Layout | Void | Title | Graph | Map;

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
  title: "title",
  graph: "graph",
  map: "map",
} as const;

export type WidgetType = keyof typeof WIDGET_TYPE;
export type NonEmptyWidgetType = Exclude<WidgetType, "void">;
