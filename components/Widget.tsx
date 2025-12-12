import { CSSProperties } from "react";

import Layout from "./widgets/Layout";
import { Void } from "./widgets/Void";

import { cn } from "@/lib/utils";
import type Widget from "@/lib/widgets/widget";

export default function Widget(props: WidgetProps) {
  return (
    <div
      className="relative w-full h-full rounded-xl animated"
      style={{
        gridRowStart: props.position.row,
        gridColumnStart: props.position.column,
      }}
    >
      <Highlight {...props.highlight} />
      {getWidgetFromType(props)}
    </div>
  );
}

type WidgetProps = Widget & {
  highlight?: HighlightProps;
};

function getWidgetFromType(props: WidgetProps) {
  switch (props.type) {
    case "layout":
      return <Layout {...props} />;

    default:
      return <Void {...props} />;
  }
}

function Highlight({ active, ...styles }: HighlightProps) {
  return (
    <div
      style={styles}
      className={cn(
        "w-full h-full absolute inset-0 rounded-xl pointer-events-none animated z-20",
        active && "ring-2",
      )}
    />
  );
}

export interface HighlightProps {
  active?: boolean;
  "--tw-ring-color"?: CSSProperties["backgroundColor"];
  top?: CSSProperties["top"];
  right?: CSSProperties["right"];
  left?: CSSProperties["left"];
  bottom?: CSSProperties["bottom"];
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  zIndex?: CSSProperties["zIndex"];
}
