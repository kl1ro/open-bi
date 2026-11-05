import { type CSSProperties, type ReactNode, useRef } from "react";
import { AnimatePresence, motion, type MotionProps } from "framer-motion";

import Widget from "@/components/Widget";
import SlotWidget from "@/components/widgets/SlotWidget";
import GridMoveHandle from "@/components/widgets/layouts/grid/GridMoveHandle";
import GridResizeHandles from "@/components/widgets/layouts/grid/GridResizeHandles";
import useGridGesture, {
  type UseGridGestureInterface,
} from "@/hooks/grid/useGridGesture";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  getGridItemsToRender,
  getRenderedGridItemKey,
  type GridItemConfig,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import type GridPreviewArea from "@/lib/widgets/layouts/grid/preview";
import type { GridPreviewRole } from "@/lib/widgets/layouts/grid/preview";
import type WidgetConfig from "@/lib/widget";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/state/hooks";
import {
  combineAnimations,
  FADE_IN_OUT_ANIMATION,
  SOFT_RESIZE_ANIMATION,
  SPRING_RESIZE_ANIMATION,
} from "@/lib/animation";

export default function GridWidget(props: GridConfig) {
  const state = useGridWidgetState(props);

  return (
    <div
      ref={state.container}
      data-resizing={state.gesture.resize.value ? "" : undefined}
      data-moving={state.gesture.move.value ? "" : undefined}
      className="group/grid size-full grid gap-8 grid-rows-(--rows) grid-cols-(--cols) relative"
      style={getGridTemplateStyle(state.grid)}
    >
      <AnimatePresence initial={false}>
        {state.itemsToRender.map((item) => (
          <GridItem
            key={getRenderedGridItemKey(item)}
            parentId={state.grid.id}
            item={item}
            gesture={state.gesture}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {state.gesture.preview.map((area) => (
          <PreviewHighlight key={area.key} area={area} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function useGridWidgetState(props: GridConfig) {
  const deps = {
    grid: props,
    itemsToRender: getGridItemsToRender(props),
    container: useRef<HTMLDivElement>(null),
    store: useAppStore(),
  };

  return {
    ...deps,
    gesture: useGridGesture(deps),
  };
}

function getGridTemplateStyle(grid: GridConfig): CSSProperties {
  return {
    "--rows": `repeat(${grid.rows}, minmax(0, 1fr))`,
    "--cols": `repeat(${grid.columns}, minmax(0, 1fr))`,
  };
}

function GridItem(props: GridItemProps) {
  return (
    <GridArea
      itemConfig={props.item.itemConfig}
      animations={[FADE_IN_OUT_ANIMATION, SPRING_RESIZE_ANIMATION]}
      className="relative group/item"
    >
      <div
        className={cn(
          "size-full transition-opacity duration-350",
          "group-data-resizing/grid:opacity-15 group-data-resizing/grid:pointer-events-none",
          "group-data-moving/grid:opacity-15 group-data-moving/grid:pointer-events-none",
        )}
      >
        <GridItemContent item={props.item} parentId={props.parentId} />
      </div>

      <GridResizeHandles item={props.item} gesture={props.gesture} />
      <GridMoveHandle item={props.item} gesture={props.gesture} />
    </GridArea>
  );
}

interface GridItemProps {
  item: GridItemToRender;
  parentId: WidgetConfig["id"];
  gesture: UseGridGestureInterface;
}

function PreviewHighlight(props: PreviewHighlightProps) {
  return (
    <GridArea
      itemConfig={props.area.itemConfig}
      animations={[FADE_IN_OUT_ANIMATION, SOFT_RESIZE_ANIMATION]}
      className={cn(
        "z-20 rounded-xl ring-2 ring-inset pointer-events-none transition-[box-shadow,background-color] duration-350",
        PREVIEW_ROLE_CLASSES[props.area.role],
      )}
    />
  );
}

interface PreviewHighlightProps {
  area: GridPreviewArea;
}

const PREVIEW_ROLE_CLASSES = {
  focused: "ring-blue-700",
  resized: "ring-blue-700",
  moved: "ring-blue-700",
  affected: "ring-blue-900",
  eaten: "ring-red-600 bg-red-600/10",
  unaffected: "ring-neutral-500",
} as const satisfies { [Role in GridPreviewRole]: string };

function GridArea(props: GridAreaProps) {
  return (
    <motion.div
      {...combineAnimations(props.animations)}
      style={getGridAreaStyle(props.itemConfig)}
      className={cn(GRID_AREA_CLASS, props.className)}
    >
      {props.children}
    </motion.div>
  );
}

interface GridAreaProps {
  itemConfig: GridItemConfig;
  animations?: readonly MotionProps[];
  className?: string;
  children?: ReactNode;
}

const GRID_AREA_CLASS =
  "row-start-(--row-start) col-start-(--col-start) row-span-(--row-span) col-span-(--col-span)";

function GridItemContent(props: GridItemContentProps) {
  if (!props.item.id)
    return <SlotWidget parentId={props.parentId} itemConfig={props.item.itemConfig} />;

  return <Widget id={props.item.id} />;
}

interface GridItemContentProps {
  item: GridItemToRender;
  parentId: WidgetConfig["id"];
}

function getGridAreaStyle(itemConfig: GridItemConfig): CSSProperties {
  return {
    "--row-span": itemConfig.size.rowSpan,
    "--col-span": itemConfig.size.colSpan,
    "--row-start": itemConfig.position.row,
    "--col-start": itemConfig.position.column,
  };
}
