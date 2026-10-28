import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";

import type { GridGestureState } from "@/components/widgets/layouts/GridWidget";
import type GridConfig from "@/lib/widgets/layouts/grid";
import {
  haveSameDelta,
  occupySameCells,
  type GridItemToRender,
} from "@/lib/widgets/layouts/grid";
import {
  createGesture,
  isGestureInProgress,
  getGridGestureDelta,
} from "@/lib/widgets/layouts/grid/gesture";
import type GridMove from "@/lib/widgets/layouts/grid/move";
import { getMovedItemConfig, getMovePreview } from "@/lib/widgets/layouts/grid/move";
import { takeOverPointerEvent } from "@/lib/pointer";
import { upsertWidget } from "@/state/features/dashboard";
import type { AppStore } from "@/state/store";

export default function useGridMove(deps: UseGridMoveDeps) {
  const move = findOngoingMove(deps);
  const innerDeps = { ...deps, move };

  return {
    value: move,
    preview: getMovePreview(move, innerDeps),
    tryStart: (deps: UseGridMoveTryStartDeps) => tryStartMove({ ...innerDeps, ...deps }),
    continue: (deps: UseGridMoveContinueDeps) => continueMove({ ...innerDeps, ...deps }),
    tryFinish: (deps: UseGridMoveTryFinishDeps) =>
      tryFinishMove({ ...innerDeps, ...deps }),
    reset: () => resetMove(innerDeps),
  };
}

export interface UseGridMoveDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  gesture: GridGestureState;
}

export interface UseGridMoveTryStartDeps {
  event: PointerEvent<HTMLElement>;
  item: GridItemToRender;
}

export interface UseGridMoveContinueDeps {
  event: PointerEvent<HTMLElement>;
}

export interface UseGridMoveTryFinishDeps {
  event: PointerEvent<HTMLElement>;
}

function findOngoingMove(deps: FindOngoingMoveDeps): GridMove | undefined {
  if (deps.gesture.value?.kind !== "move") return;
  return deps.gesture.value;
}

type FindOngoingMoveDeps = Pick<UseGridMoveDeps, "gesture">;

function tryStartMove(deps: TryStartMoveDeps) {
  if (isGestureInProgress(deps.gesture.value)) return;

  try {
    const innerDeps = {
      ...deps,
      widgetConfigs: deps.store.getState().dashboard.widgetConfigs,
    };

    const gesture = createGesture(innerDeps);
    takeOverPointerEvent(deps.event);
    deps.gesture.set({ ...gesture, kind: "move" });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать перемещение виджета");
  }
}

type TryStartMoveDeps = UseGridMoveDeps & UseGridMoveTryStartDeps;

function continueMove(deps: ContinueMoveDeps) {
  if (!deps.move) return;
  const delta = getGridGestureDelta(deps.move, deps);
  if (haveSameDelta(delta, deps.move.delta)) return;
  deps.gesture.set({ ...deps.move, delta });
}

type ContinueMoveDeps = Pick<UseGridMoveDeps, "gesture"> &
  UseGridMoveContinueDeps & { move?: GridMove };

function tryFinishMove(deps: TryFinishMoveDeps) {
  if (!deps.move) return;

  try {
    const delta = getGridGestureDelta(deps.move, deps);
    const updatedMove = { ...deps.move, delta };
    applyMove(updatedMove, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось переместить виджет");
  }

  resetMove(deps);
}

type TryFinishMoveDeps = Pick<UseGridMoveDeps, "gesture" | "grid" | "store"> &
  UseGridMoveTryFinishDeps & { move?: GridMove };

function resetMove(deps: ResetMoveDeps) {
  deps.gesture.set(undefined);
}

type ResetMoveDeps = Pick<UseGridMoveDeps, "gesture">;

function applyMove(move: GridMove, deps: ApplyMoveDeps) {
  const itemConfig = getMovedItemConfig(move, deps);
  if (occupySameCells(move.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: move.owner.child, itemConfig }));
}

type ApplyMoveDeps = Pick<UseGridMoveDeps, "grid" | "store">;
