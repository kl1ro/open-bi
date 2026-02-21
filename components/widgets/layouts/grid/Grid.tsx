import { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Widget from "../../../Widget";
import GridResizeOverlay from "./GridResizeOverlay";

import type Grid from "@/lib/widgets/layouts/grid";
import { takesSpace } from "@/lib/widgets/layouts/grid";

export default function Grid(props: Grid) {
  return (
    <div
      className="w-full h-full grid gap-8 grid-rows-(--rows) grid-cols-(--cols) relative"
      style={
        {
          "--rows": `repeat(${props.rows}, minmax(0, 1fr))`,
          "--cols": `repeat(${props.columns}, minmax(0, 1fr))`,
        } as CSSProperties
      }
    >
      <AnimatePresence>
        {props.children
          ?.filter((widget) => takesSpace(widget))
          .map((widget) => (
            <motion.div
              layout
              style={
                {
                  "--row-span": widget.size.rowSpan,
                  "--col-span": widget.size.colSpan,
                  "--row-start": widget.position.row,
                  "--col-start": widget.position.column,
                } as CSSProperties
              }
              key={widget.id}
              className="relative row-start-(--row-start) col-start-(--col-start) row-span-(--row-span) col-span-(--col-span)"
            >
              <Widget {...widget} />
            </motion.div>
          ))}
      </AnimatePresence>

      <GridResizeOverlay grid={props} />
    </div>
  );
}
