import Layout from "./widgets/Layout";
import { Void } from "./widgets/Void";

import { cn } from "@/lib/utils";
import type Widget from "@/lib/widgets/widget";

export default function Widget(props: WidgetProps) {
  return (
    <div
      className={cn(
        "w-full h-full rounded-xl animated",
        `${props.selected ? "ring-blue-700 ring-2" : ""}`,
      )}
      style={{
        gridRowStart: props.position.row,
        gridColumnStart: props.position.column,
      }}
    >
      {getWidgetFromType(props)}
    </div>
  );
}

function getWidgetFromType(props: WidgetProps) {
  switch (props.type) {
    case "layout":
      return <Layout {...props} />;

    default:
      return <Void {...props} />;
  }
}

type WidgetProps = Widget & {
  selected?: boolean;
};
