import type { DashboardState } from "@/state/features/dashboard";

const DASHBOARD_LOCALSTORAGE_KEY = "dashboard";

export function saveDashboardToLocalStorage(dashboard: DashboardState) {
  try {
    localStorage.setItem(DASHBOARD_LOCALSTORAGE_KEY, JSON.stringify(dashboard));
  } catch (error) {
    throw new SaveDashboardError({ cause: error });
  }
}

export class SaveDashboardError extends Error {
  public name = SaveDashboardError.name;

  public constructor(options?: ErrorOptions) {
    super("Error while saving the dashboard", options);
  }
}

export function restoreDashboardFromLocalStorage() {
  try {
    const storageItem = localStorage.getItem(DASHBOARD_LOCALSTORAGE_KEY);
    if (!storageItem) return;
    return JSON.parse(storageItem) as DashboardState;
  } catch (error) {
    throw new RestoreDashboardError({ cause: error });
  }
}

export class RestoreDashboardError extends Error {
  public name = RestoreDashboardError.name;

  public constructor(options?: ErrorOptions) {
    super("Error while trying to restore the dashboard", options);
  }
}
