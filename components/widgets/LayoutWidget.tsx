import AbsoluteWidget from "./layouts/AbsoluteWidget";
import FlexWidget from "./layouts/FlexWidget";
import GridWidget from "./layouts/GridWidget";

import { cn } from "@/lib/utils";
import type LayoutConfig from "@/lib/widgets/layout";

export default function Layout(props: LayoutConfig) {
  return (
    <div className={cn("size-full", props.parentId && "p-5")}>
      {getLayoutByType({ layout: props })}
    </div>
  );
}

function getLayoutByType(deps: GetLayoutTypeDeps) {
  switch (deps.layout.layout) {
    case "grid":
      return <GridWidget {...deps.layout} />;

    case "flex":
      return <FlexWidget />;

    case "absolute":
      return <AbsoluteWidget />;
  }
}

interface GetLayoutTypeDeps {
  layout: LayoutConfig;
}
