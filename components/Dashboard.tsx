"use client";
import { useEffect } from "react";
import { toast } from "sonner";

import Widget from "@/components/Widget";
import SlotWidget from "@/components/widgets/SlotWidget";
import { findRootConfig, setDashboard } from "@/state/features/dashboard";
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
    rootConfig: useAppSelector((state) => findRootConfig({ state: state.dashboard })),
  };
}

function useDashboardEffects() {
  useRestoreDashboardEffect();
  useSaveDashboardEffect();
}

function useRestoreDashboardEffect() {
  const state = useRestoreDashboardEffectState();

  useEffect(() => {
    tryRestoreDashboard(state);
  }, []);
}

function useSaveDashboardEffect() {
  const state = useSaveDashboardEffectState();

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

function useRestoreDashboardEffectState() {
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

function useSaveDashboardEffectState() {
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
