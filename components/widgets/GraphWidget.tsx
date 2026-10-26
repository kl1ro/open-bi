import LineGraph from "@/components/widgets/graphs/LineGraph";
import type GraphConfig from "@/lib/widgets/graph";

export default function GraphWidget(props: GraphConfig) {
  switch (props.graph) {
    case "line":
      return <LineGraph />;

    default:
      return props.graph satisfies never;
  }
}
