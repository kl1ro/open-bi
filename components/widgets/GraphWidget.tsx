import LineGraph from "@/components/widgets/graphs/LineGraph";
import type GraphConfig from "@/lib/widgets/graph";

export default function GraphWidget(props: GraphConfig) {
  switch (props.graph) {
    case "line":
      return <LineGraph />;

    default:
      handleUnexpectedGraphType(props.graph);
  }
}

function handleUnexpectedGraphType(graph: never) {
  console.error(new UnexpectedGraphTypeError({ type: graph }));
}

export class UnexpectedGraphTypeError extends Error {
  public name = UnexpectedGraphTypeError.name;
  public type: unknown;

  public constructor(options: ErrorOptions & { type: unknown }) {
    super(`Graph type ${options.type as string} is unexpected`, options);
    this.type = options.type;
  }
}
