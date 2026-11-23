import { type Dispatch, type RefObject, type SetStateAction, useState } from "react";
import type GridConfig from "@kl1ro/mip-bi-core/widgets/layouts/grid";

import useGridResize from "@/hooks/grid/gestures/useGridResize";
import useGridMove from "@/hooks/grid/gestures/useGridMove";
import type { GridItemToRender } from "@/lib/widgets/layouts/grid";
import type GridGesture from "@/lib/widgets/layouts/grid/gesture";
import type { AppStore } from "@/state/store";

export default function useGridGesture(deps: UseGridGestureDeps) {
  const [value, set] = useState<GridGesture>();
  const current = { value, set };
  const innerDeps = { ...deps, currentGesture: current };
  const [resize, move] = [useGridResize(innerDeps), useGridMove(innerDeps)];

  return {
    current,
    resize,
    move,
    preview: [...resize.preview, ...move.preview],
  };
}

export interface UseGridGestureDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
}

export type UseGridGestureInterface = ReturnType<typeof useGridGesture>;

export interface CurrentGridGestureState {
  value: GridGesture | undefined;
  set: Dispatch<SetStateAction<CurrentGridGestureState["value"]>>;
}
