import type { PointerEvent, RefObject } from "react";
import { toast } from "sonner";
import type GridConfig from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import { occupySameCells } from "@kl1ro/mip-bi-core/widgets/layouts/grid";

import type { CurrentGridGestureState } from "@/hooks/grid/useGridGesture";
import type { GridItemToRender } from "@/lib/widgets/layouts/grid";
import {
  createGesture,
  haveSameDelta,
  isGestureInProgress,
} from "@/lib/widgets/layouts/grid/gesture";
import type GridResize from "@/lib/widgets/layouts/grid/resize";
import {
  getResizeWithPointerDelta,
  getResizedItemConfig,
  getResizePreview,
  type GridResizeHandleConfig,
} from "@/lib/widgets/layouts/grid/resize";
import { takeOverPointerEvent } from "@/lib/pointer";
import bindDeps from "@/lib/deps";
import { upsertWidget } from "@/state/features/dashboard";
import type { AppStore } from "@/state/store";

export default function useGridResize(deps: UseGridResizeDeps) {
  const resize = findOngoingResize(deps);
  const innerDeps = { ...deps, resize };

  return {
    value: resize,
    preview: getResizePreview(resize, innerDeps),
    tryStart: bindDeps(tryStartResize, innerDeps),
    continue: bindDeps(continueResize, innerDeps),
    tryFinish: bindDeps(tryFinishResize, innerDeps),
    reset: bindDeps(resetResize, innerDeps),
  };
}

export interface UseGridResizeDeps {
  currentGesture: CurrentGridGestureState;
  grid: GridConfig;
  itemsToRender: GridItemToRender[];
  container: RefObject<HTMLDivElement | null>;
  store: AppStore;
}

function findOngoingResize(deps: FindOngoingResizeDeps): GridResize | undefined {
  if (deps.currentGesture.value?.kind !== "resize") return;
  return deps.currentGesture.value;
}

interface FindOngoingResizeDeps {
  currentGesture: CurrentGridGestureState;
}

function tryStartResize(deps: TryStartResizeDeps) {
  if (isGestureInProgress(deps.currentGesture.value)) return;

  try {
    const innerDeps = {
      ...deps,
      dashboard: deps.store.getState().dashboard,
    };

    const gesture = createGesture(innerDeps);
    takeOverPointerEvent(deps.event);
    deps.currentGesture.set({ ...gesture, kind: "resize", sides: deps.handle.sides });
  } catch (error) {
    console.error(error);
    toast.error("Не удалось начать изменение размера виджета");
  }
}

interface TryStartResizeDeps {
  grid: GridConfig;
  container: RefObject<HTMLDivElement | null>;
  currentGesture: CurrentGridGestureState;
  store: AppStore;
  event: PointerEvent<HTMLElement>;
  handle: GridResizeHandleConfig;
  item: GridItemToRender;
}

function continueResize(deps: ContinueResizeDeps) {
  if (!deps.resize) return;
  const continuedResize = getResizeWithPointerDelta(deps.resize, deps.event);
  if (haveSameDelta(continuedResize.delta, deps.resize.delta)) return;
  deps.currentGesture.set(continuedResize);
}

interface ContinueResizeDeps {
  currentGesture: CurrentGridGestureState;
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
}

function tryFinishResize(deps: TryFinishResizeDeps) {
  try {
    if (!deps.resize) return;
    const finishedResize = getResizeWithPointerDelta(deps.resize, deps.event);
    applyResize(finishedResize, deps);
  } catch (error) {
    console.error(error);
    toast.error("Не удалось изменить размер виджета");
  } finally {
    resetResize(deps);
  }
}

interface TryFinishResizeDeps {
  grid: GridConfig;
  currentGesture: CurrentGridGestureState;
  store: AppStore;
  resize?: GridResize;
  event: PointerEvent<HTMLElement>;
}

function resetResize(deps: ResetResizeDeps) {
  if (!deps.resize) return;
  deps.currentGesture.set(undefined);
}

interface ResetResizeDeps {
  currentGesture: CurrentGridGestureState;
  resize?: GridResize;
}

function applyResize(resize: GridResize, deps: ApplyResizeDeps) {
  const itemConfig = getResizedItemConfig(resize, deps);
  if (occupySameCells(resize.owner.itemConfig, itemConfig)) return;
  deps.store.dispatch(upsertWidget({ widgetConfig: resize.owner.child, itemConfig }));
}

interface ApplyResizeDeps {
  grid: GridConfig;
  store: AppStore;
}
