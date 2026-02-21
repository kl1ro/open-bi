import Layout from "./widgets/Layout";
import { Void } from "./widgets/Void";

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

    default:
      return <Void {...props} />;
  }
}
