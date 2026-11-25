import type DashboardConfig from "@kl1ro/mip-bi-core/dashboard";
import { DASHBOARD_CONFIG_SCHEMA } from "@kl1ro/mip-bi-core/schemas/dashboard";

const DASHBOARD_LOCALSTORAGE_KEY = "dashboard";

export function saveDashboardToLocalStorage(dashboard: DashboardConfig) {
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

export function restoreDashboardFromLocalStorage(): DashboardConfig | undefined {
  const storedDashboard = findStoredDashboard();
  if (!storedDashboard) return;
  const dashboard = parseDashboard(storedDashboard);
  return dashboard;
}

export class RestoreDashboardError extends Error {
  public name = RestoreDashboardError.name;

  public constructor(options?: ErrorOptions & { message?: string }) {
    super(options?.message ?? "Error while trying to restore the dashboard", options);
  }
}

function findStoredDashboard(): string | undefined {
  try {
    return localStorage.getItem(DASHBOARD_LOCALSTORAGE_KEY) ?? undefined;
  } catch (error) {
    throw new RestoreDashboardError({ cause: error });
  }
}

function parseDashboard(storedDashboard: string): DashboardConfig {
  const json = parseJson(storedDashboard);
  const validation = DASHBOARD_CONFIG_SCHEMA.safeParse(json);
  if (!validation.success) throw new CorruptedDashboardError({ cause: validation.error });
  return validation.data;
}

export class CorruptedDashboardError extends RestoreDashboardError {
  public name = CorruptedDashboardError.name;

  public constructor(options?: ErrorOptions) {
    super({ ...options, message: "Stored dashboard is corrupted" });
  }
}

function parseJson(text: string): unknown {
  try {
    const json: unknown = JSON.parse(text);
    return json;
  } catch (error) {
    throw new CorruptedDashboardError({ cause: error });
  }
}
