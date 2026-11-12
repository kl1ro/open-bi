import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type WidgetConfig from "@kl1ro/mip-bi-core/widget";
import type GridConfig from "@kl1ro/mip-bi-core/widgets/layouts/grid";
import type TitleConfig from "@kl1ro/mip-bi-core/widgets/title";
import type GraphConfig from "@kl1ro/mip-bi-core/widgets/graph";
import type MapConfig from "@kl1ro/mip-bi-core/widgets/map";
import { MAP_VIEWS } from "@kl1ro/mip-bi-core/widgets/map";

import { isNumber } from "@/lib/utils";
import { SPACING_OPTIONS } from "@/lib/widgets/layouts/grid";

export function getDefaultFormValues(type: WidgetFormValues["type"]): WidgetFormValues {
  switch (type) {
    case "layout":
      return { type, columns: "4", rows: "1" };

    case "title":
      return { type, text: "" };

    case "graph":
      return { type };

    case "map":
      return {
        type,
        latitude: "55.751244",
        longitude: "37.618423",
        zoom: "13",
        view: "hybrid",
      };

    default:
      throw getUnexpectedFormTypeError(type);
  }
}

export function getWidgetConfigFromFormValues(
  values: WidgetFormValues,
  deps: GetWidgetConfigFromFormValuesDeps,
): WidgetConfig {
  const id = deps.id ?? crypto.randomUUID();
  const innerDeps = { ...deps, id };

  switch (values.type) {
    case "layout":
      return getGridConfigFromFormValues(values, innerDeps);

    case "title":
      return getTitleConfigFromFormValues(values, innerDeps);

    case "graph":
      return getGraphConfigFromFormValues(values, innerDeps);

    case "map":
      return getMapConfigFromFormValues(values, innerDeps);

    default:
      throw getUnexpectedFormValuesTypeError(values);
  }
}

export interface GetWidgetConfigFromFormValuesDeps {
  id?: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getUnexpectedFormTypeError(type: never) {
  return type ? new NonexistentFormTypeError({ type }) : new NoFormTypeError();
}

function getGridConfigFromFormValues(
  values: LayoutWidgetFormValues,
  deps: GetGridConfigFromFormValuesDeps,
): GridConfig {
  return {
    id: deps.id,
    parentId: deps.parentId,
    type: "layout",
    layout: "grid",
    columns: Number(values.columns),
    rows: Number(values.rows),
    children: [],
    arrangement: {},
  };
}

interface GetGridConfigFromFormValuesDeps {
  id: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getTitleConfigFromFormValues(
  values: TitleWidgetFormValues,
  deps: GetTitleConfigFromFormValuesDeps,
): TitleConfig {
  return { id: deps.id, parentId: deps.parentId, type: "title", text: values.text };
}

interface GetTitleConfigFromFormValuesDeps {
  id: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getGraphConfigFromFormValues(
  values: GraphWidgetFormValues,
  deps: GetGraphConfigFromFormValuesDeps,
): GraphConfig {
  return { id: deps.id, parentId: deps.parentId, type: "graph", graph: "line" };
}

interface GetGraphConfigFromFormValuesDeps {
  id: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getMapConfigFromFormValues(
  values: MapWidgetFormValues,
  deps: GetMapConfigFromFormValuesDeps,
): MapConfig {
  return {
    id: deps.id,
    parentId: deps.parentId,
    type: "map",

    center: {
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
    },

    zoom: Number(values.zoom),
    view: values.view,
  };
}

interface GetMapConfigFromFormValuesDeps {
  id: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getUnexpectedFormValuesTypeError(values: never) {
  const type = (values as { type?: unknown })?.type;
  return type ? new NonexistentFormTypeError({ type }) : new NoFormTypeError();
}

export class NoFormTypeError extends Error {
  public name = NoFormTypeError.name;

  public constructor(options?: ErrorOptions) {
    super(`Widget form has no type`, options);
  }
}

export class NonexistentFormTypeError extends Error {
  public name = NonexistentFormTypeError.name;
  public type: unknown;

  public constructor(options: ErrorOptions & { type: unknown }) {
    super(`Widget form type ${String(options.type)} does not exist`, options);
    this.type = options.type;
  }
}

export interface WidgetFormFieldProps {
  form: UseFormReturn<WidgetFormValues>;
}

export const WIDGET_FORM_SCHEMA = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("layout"),
    columns: z.enum(SPACING_OPTIONS),
    rows: z.enum(SPACING_OPTIONS),
  }),
  z.object({ type: z.literal("title"), text: z.string().min(1) }),
  z.object({ type: z.literal("graph") }),
  z.object({
    type: z.literal("map"),

    latitude: z
      .string()
      .refine((value) => isNumberInRange(value, -90, 90), "Широта — число от -90 до 90"),

    longitude: z
      .string()
      .refine(
        (value) => isNumberInRange(value, -180, 180),
        "Долгота — число от -180 до 180",
      ),

    zoom: z
      .string()
      .refine((value) => isNumberInRange(value, 0, 21), "Масштаб — число от 0 до 21"),

    view: z.enum(MAP_VIEWS),
  }),
]);

function isNumberInRange(value: string, min: number, max: number) {
  const number = Number(value);
  return value.trim() !== "" && isNumber(number) && number >= min && number <= max;
}

export type WidgetFormValues = z.infer<typeof WIDGET_FORM_SCHEMA>;
type LayoutWidgetFormValues = Extract<WidgetFormValues, { type: "layout" }>;
type TitleWidgetFormValues = Extract<WidgetFormValues, { type: "title" }>;
type GraphWidgetFormValues = Extract<WidgetFormValues, { type: "graph" }>;
type MapWidgetFormValues = Extract<WidgetFormValues, { type: "map" }>;
