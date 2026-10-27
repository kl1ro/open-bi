import LineGraph from "@/components/widgets/graphs/LineGraph";
import type GraphConfig from "@/lib/widgets/graph";
import { getUnexpectedGraphTypeError } from "@/lib/widgets/graph";

export default function GraphWidget(props: GraphConfig) {
  switch (props.graph) {
    case "line":
      return <LineGraph />;

    default:
      handleUnexpectedGraphType(props.graph);
  }
}

function handleUnexpectedGraphType(graph: never) {
  console.error(getUnexpectedGraphTypeError(graph));
}
