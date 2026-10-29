import { type Dispatch, type SetStateAction, useState } from "react";

import useGridResize, {
  type UseGridResizeDeps,
} from "@/hooks/grid/gestures/useGridResize";
import useGridMove, { type UseGridMoveDeps } from "@/hooks/grid/gestures/useGridMove";
import type GridGesture from "@/lib/widgets/layouts/grid/gesture";

export default function useGridGesture(deps: UseGridGestureDeps) {
  const [value, set] = useState<GridGesture>();
  const innerDeps = { ...deps, currentGesture: { value, set } };

  return {
    current: { value, set },
    resize: useGridResize(innerDeps),
    move: useGridMove(innerDeps),
  };
}

export type UseGridGestureDeps = Omit<
  UseGridResizeDeps & UseGridMoveDeps,
  "currentGesture"
>;

export interface CurrentGridGestureState {
  value: GridGesture | undefined;
  set: Dispatch<SetStateAction<CurrentGridGestureState["value"]>>;
}
