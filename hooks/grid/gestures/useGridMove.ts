import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";

import type { CurrentGridGestureState } from "@/hooks/grid/useGridGesture";
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
import { bindDeps } from "@/lib/utils";
import { upsertWidget } from "@/state/features/dashboard";
import type { AppStore } from "@/state/store";

export default function useGridMove(deps: UseGridMoveDeps) {
  const move = findOngoingMove(deps);
  const innerDeps = { ...deps, move };

  return {
    value: move,
    preview: getMovePreview(move, innerDeps),
    tryStart: bindDeps(tryStartMove, innerDeps),
    continue: bindDeps(continueMove, innerDeps),
    tryFinish: bindDeps(tryFinishMove, innerDeps),
    reset: bindDeps(resetMove, innerDeps),
  };
}

export interface UseGridMoveDeps {
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
  currentGesture: CurrentGridGestureState;
}

function findOngoingMove(deps: FindOngoingMoveDeps): GridMove | undefined {
  if (deps.currentGesture.value?.kind !== "move") return;
  return deps.currentGesture.value;
}

type FindOngoingMoveDeps = Pick<UseGridMoveDeps, "currentGesture">;

function tryStartMove(deps: TryStartMoveDeps) {
  if (isGestureInProgress(deps.currentGesture.value)) return;

  try {
    const innerDeps = {
      ...deps,
      widgetConfigs: deps.store.getState().dashboard.widgetConfigs,
    };

    const gesture = createGesture(innerDeps);
    takeOverPointerEvent(deps.event);
    deps.currentGesture.set({ ...gesture, kind: "move" });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать перемещение виджета");
  }
}

type TryStartMoveDeps = Pick<
  UseGridMoveDeps,
  "currentGesture" | "store" | "grid" | "container"
> & {
  event: PointerEvent<HTMLElement>;
  item: GridItemToRender;
};

function continueMove(deps: ContinueMoveDeps) {
  if (!deps.move) return;
  const delta = getGridGestureDelta(deps.move, deps);
  if (haveSameDelta(delta, deps.move.delta)) return;
  deps.currentGesture.set({ ...deps.move, delta });
}

type ContinueMoveDeps = Pick<UseGridMoveDeps, "currentGesture"> & {
  move?: GridMove;
  event: PointerEvent<HTMLElement>;
};

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

type TryFinishMoveDeps = Pick<UseGridMoveDeps, "currentGesture" | "grid" | "store"> & {
  move?: GridMove;
  event: PointerEvent<HTMLElement>;
};

function resetMove(deps: ResetMoveDeps) {
  deps.currentGesture.set(undefined);
}

type ResetMoveDeps = Pick<UseGridMoveDeps, "currentGesture">;

function applyMove(move: GridMove, deps: ApplyMoveDeps) {
  const itemConfig = getMovedItemConfig(move, deps);
  if (occupySameCells(move.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: move.owner.child, itemConfig }));
}

type ApplyMoveDeps = Pick<UseGridMoveDeps, "grid" | "store">;
