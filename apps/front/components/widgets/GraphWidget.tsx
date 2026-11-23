import type GraphConfig from "@kl1ro/mip-bi-core/widgets/graph";
import { getUnexpectedGraphTypeError } from "@kl1ro/mip-bi-core/widgets/graph";

import LineGraph from "@/components/widgets/graphs/LineGraph";

export default function GraphWidget(props: GraphConfig) {
  switch (props.graph) {
    case "line":
      return <LineGraph />;

    default:
      throw getUnexpectedGraphTypeError(props.graph);
  }
}
