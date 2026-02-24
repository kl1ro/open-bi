import Graph from "./widgets/Graph";
import Layout from "./widgets/Layout";
import Title from "./widgets/Title";
import { Void } from "./widgets/Void";
import Map from "./widgets/Map";

import type Widget from "@/lib/widget";

export default function Widget(props: Widget) {
  return (
    <div className="relative w-full h-full rounded-xl animated no-scrollbar overflow-auto">
      {getWidgetByType(props)}
    </div>
  );
}

function getWidgetByType(props: Widget) {
  switch (props.type) {
    case "layout":
      return <Layout {...props} />;

    case "title":
      return <Title {...props} />;

    case "graph":
      return <Graph {...props} />;

    case "map":
      return <Map />;

    default:
      return <Void {...props} />;
  }
}
