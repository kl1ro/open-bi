import Absolute from "./layouts/Absolute";
import Flex from "./layouts/Flex";
import Grid from "./layouts/grid/Grid";

import type Layout from "@/lib/widgets/layout";

export default function Layout(props: Layout) {
  switch (props.layout) {
    case "grid":
      return <Grid {...props} />;

    case "flex":
      return <Flex />;

    case "absolute":
      return <Absolute />;
  }
}
