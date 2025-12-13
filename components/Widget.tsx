import { CSSProperties, useEffect, useState } from "react";

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
        gridRowEnd: `span ${props.size.rowSpan}`,
        gridColumnEnd: `span ${props.size.colSpan}`,
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

function Highlight(props: HighlightProps) {
  const { active, ...style } = props;
  const [styleFallback, setStyleFallback] = useState<HighlightProps>(style);

  useEffect(() => {
    if (Object.keys(style).length) setStyleFallback(style);
    else {
      setTimeout(
        () => setStyleFallback({ ...style, transitionProperty: "none" }),
        300,
      );
      setTimeout(
        () => setStyleFallback({ ...style, transitionProperty: "all" }),
        320,
      );
    }
  }, [props]);

  return (
    <div
      style={styleFallback}
      className={cn(
        "w-full h-full absolute inset-0 rounded-xl pointer-events-none animated z-20",
        active && "ring-2",
      )}
    />
  );
}

export interface HighlightProps extends CSSProperties {
  active?: boolean;
  "--tw-ring-color"?: CSSProperties["backgroundColor"];
}
