"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import Widget from "@/components/Widget";
import SlotWidget from "@/components/widgets/SlotWidget";
import { selectRootConfig, setDashboard } from "@/state/features/dashboard";
import { useAppSelector, useAppStore } from "@/state/hooks";
import type { AppStore } from "@/state/store";
import { isSaveEvent } from "@/lib/keyboard";
import {
  restoreDashboardFromLocalStorage,
  saveDashboardToLocalStorage,
} from "@/lib/localstorage";

export default function Dashboard() {
  const state = useDashboardState();
  useDashboardEffects();
  if (!state.rootConfig) return <SlotWidget />;
  return <Widget id={state.rootConfig.id} />;
}

function useDashboardState() {
  return {
    rootConfig: useAppSelector(selectRootConfig),
  };
}

function useDashboardEffects() {
  useDashboardRestoreEffect();
  useDashboardSaveEffect();
}

function useDashboardRestoreEffect() {
  const state = useDashboardRestoreEffectState();

  useEffect(() => {
    tryRestoreDashboard(state);
  }, []);
}

function useDashboardSaveEffect() {
  const state = useDashboardSaveEffectState();

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (!isSaveEvent(e)) return;
      e.preventDefault();
      trySaveDashboard(state);
    };

    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
}

function useDashboardRestoreEffectState() {
  return {
    store: useAppStore(),
  };
}

function tryRestoreDashboard(deps: TryRestoreDashboardDeps) {
  try {
    const dashboard = restoreDashboardFromLocalStorage();
    if (!dashboard) return;
    deps.store.dispatch(setDashboard(dashboard));
    toast.success("Дэшборд восстановлен из предыдущей сессии");
  } catch (error) {
    console.error(error);
    toast.error("Не удалось восстановить дэшборд из предыдущей сессии");
  }
}

interface TryRestoreDashboardDeps {
  store: AppStore;
}

function useDashboardSaveEffectState() {
  return {
    store: useAppStore(),
  };
}

function trySaveDashboard(deps: TrySaveDashboardDeps) {
  try {
    saveDashboardToLocalStorage(deps.store.getState().dashboard);
    toast.success("Дэшборд сохранён");
  } catch (error) {
    console.error(error);
    toast.error("Не удалось сохранить дэшборд");
  }
}

interface TrySaveDashboardDeps {
  store: AppStore;
}
