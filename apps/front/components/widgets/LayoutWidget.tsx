import type LayoutConfig from "@kl1ro/mip-bi-core/widgets/layout";
import { getUnexpectedLayoutTypeError } from "@kl1ro/mip-bi-core/widgets/layout";

import AbsoluteWidget from "@/components/widgets/layouts/AbsoluteWidget";
import FlexWidget from "@/components/widgets/layouts/FlexWidget";
import GridWidget from "@/components/widgets/layouts/GridWidget";
import { cn } from "@/lib/utils";

export default function LayoutWidget(props: LayoutConfig) {
  return (
    <div className={cn("size-full", props.parentId && "p-5")}>
      {getLayoutByType(props)}
    </div>
  );
}

function getLayoutByType(layout: LayoutConfig) {
  switch (layout.layout) {
    case "grid":
      return <GridWidget {...layout} />;

    case "flex":
      return <FlexWidget />;

    case "absolute":
      return <AbsoluteWidget />;

    default:
      throw getUnexpectedLayoutTypeError(layout);
  }
}
