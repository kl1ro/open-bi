import LineGraph from "./graphs/LineGraph";

import type Graph from "@/lib/widgets/graph";

export default function Graph(props: Graph) {
  switch (props.graph) {
    case "line":
      return <LineGraph />;
  }
}
