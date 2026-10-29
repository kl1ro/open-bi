import { type Dispatch, type RefObject, type SetStateAction, useState } from "react";

import useGridResize from "@/hooks/grid/gestures/useGridResize";
import useGridMove from "@/hooks/grid/gestures/useGridMove";
import type GridConfig from "@/lib/widgets/layouts/grid";
import type { GridItemToRender } from "@/lib/widgets/layouts/grid";
import type GridGesture from "@/lib/widgets/layouts/grid/gesture";
import type { AppStore } from "@/state/store";

export default function useGridGesture(deps: UseGridGestureDeps) {
  const [value, set] = useState<GridGesture>();
  const innerDeps = { ...deps, currentGesture: { value, set } };

  return {
    current: { value, set },
    resize: useGridResize(innerDeps),
    move: useGridMove(innerDeps),
  };
}

export interface UseGridGestureDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
}

export interface CurrentGridGestureState {
  value: GridGesture | undefined;
  set: Dispatch<SetStateAction<CurrentGridGestureState["value"]>>;
}

export type UseGridGestureInterface = ReturnType<typeof useGridGesture>;
