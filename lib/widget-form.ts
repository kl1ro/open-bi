import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { isNumber } from "@/lib/utils";
import type WidgetConfig from "@/lib/widget";
import type GridConfig from "@/lib/widgets/layouts/grid";
import { SPACING_OPTIONS } from "@/lib/widgets/layouts/grid";
import type TitleConfig from "@/lib/widgets/title";
import type GraphConfig from "@/lib/widgets/graph";
import type MapConfig from "@/lib/widgets/map";
import { MAP_VIEWS } from "@/lib/widgets/map";

export function getDefaultFormValues(type: FormValues["type"]): FormValues {
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
  values: FormValues,
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
  values: LayoutFormValues,
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
  values: TitleFormValues,
  deps: GetTitleConfigFromFormValuesDeps,
): TitleConfig {
  return { id: deps.id, parentId: deps.parentId, type: "title", text: values.text };
}

interface GetTitleConfigFromFormValuesDeps {
  id: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getGraphConfigFromFormValues(
  values: GraphFormValues,
  deps: GetGraphConfigFromFormValuesDeps,
): GraphConfig {
  return { id: deps.id, parentId: deps.parentId, type: "graph", graph: "line" };
}

interface GetGraphConfigFromFormValuesDeps {
  id: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function getMapConfigFromFormValues(
  values: MapFormValues,
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

export interface FieldProps {
  form: UseFormReturn<FormValues>;
}

export const formSchema = z.discriminatedUnion("type", [
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

export type FormValues = z.infer<typeof formSchema>;
type LayoutFormValues = Extract<FormValues, { type: "layout" }>;
type TitleFormValues = Extract<FormValues, { type: "title" }>;
type GraphFormValues = Extract<FormValues, { type: "graph" }>;
type MapFormValues = Extract<FormValues, { type: "map" }>;
