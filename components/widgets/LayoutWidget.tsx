import AbsoluteWidget from "@/components/widgets/layouts/AbsoluteWidget";
import FlexWidget from "@/components/widgets/layouts/FlexWidget";
import GridWidget from "@/components/widgets/layouts/GridWidget";
import { cn } from "@/lib/utils";
import type LayoutConfig from "@/lib/widgets/layout";
import { getUnexpectedLayoutTypeError } from "@/lib/widgets/layout";

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
