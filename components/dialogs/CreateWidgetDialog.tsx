"use client";

import type { Dispatch, SetStateAction } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type WidgetConfig from "@/lib/widget";
import type { ItemConfig } from "@/lib/widget";
import { SPACING_OPTIONS } from "@/lib/widgets/layouts/grid";
import { MAP_VIEWS, type MapView } from "@/lib/widgets/map";
import { upsertWidget } from "@/state/features/dashboard";
import { useAppDispatch } from "@/state/hooks";
import type { AppDispatch } from "@/state/store";

export default function CreateWidgetDialog(props: CreateWidgetDialogProps) {
  const state = useCreateWidgetDialogState(props);

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.setOpen(false)}>
      <DialogContent className="bg-medium border-light text-secondary">
        <DialogTitle>Создайте виджет дэшборда</DialogTitle>
        <DialogDescription />

        <Form {...state.form}>
          <form
            onSubmit={state.form.handleSubmit((values) =>
              createWidgetFromFormValues(values, state),
            )}
            className="space-y-4 mt-4"
          >
            <WidgetTypeField form={state.form} />

            {state.type == "layout" && (
              <>
                <SpacingField
                  form={state.form}
                  name="columns"
                  label="Количество столбцов"
                />
                <SpacingField form={state.form} name="rows" label="Количество строк" />
              </>
            )}

            {state.type == "title" && <TitleTextField form={state.form} />}

            {state.type == "map" && (
              <>
                <NumberTextField form={state.form} name="latitude" label="Широта" />
                <NumberTextField form={state.form} name="longitude" label="Долгота" />
                <NumberTextField form={state.form} name="zoom" label="Масштаб" />
                <MapViewField form={state.form} />
              </>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button className="cursor-pointer">Отменить</Button>
              </DialogClose>

              <Button type="submit" className="cursor-pointer">
                Создать
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export interface CreateWidgetDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  id?: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
  itemConfig?: ItemConfig;
}

function useCreateWidgetDialogState(props: CreateWidgetDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultFormValues("layout"),
  });

  return {
    form,
    type: form.watch("type"),
    dispatch: useAppDispatch(),
    parentId: props.parentId,
    itemConfig: props.itemConfig,
    close: () => props.setOpen(false),
  };
}

function getDefaultFormValues(type: FormValues["type"]): FormValues {
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
      return type satisfies never;
  }
}

function createWidgetFromFormValues(
  values: FormValues,
  deps: CreateWidgetFromFormValuesDeps,
) {
  const widgetConfig = getWidgetConfigFromFormValues(values, deps);
  deps.dispatch(upsertWidget({ widgetConfig, itemConfig: deps.itemConfig }));
  deps.close();
}

export interface CreateWidgetFromFormValuesDeps {
  dispatch: AppDispatch;
  id?: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
  itemConfig?: ItemConfig;
  close: () => void;
}

function getWidgetConfigFromFormValues(
  values: FormValues,
  deps: GetWidgetConfigFromFormValuesDeps,
): WidgetConfig {
  const id = deps.id ?? crypto.randomUUID();
  const parentId = deps.parentId;

  switch (values.type) {
    case "layout":
      return {
        id,
        parentId,
        type: "layout",
        layout: "grid",
        columns: Number(values.columns),
        rows: Number(values.rows),
        children: [],
        arrangement: {},
      };

    case "title":
      return { id, parentId, type: "title", text: values.text };

    case "graph":
      return { id, parentId, type: "graph", graph: "line" };

    case "map":
      return {
        id,
        parentId,
        type: "map",
        center: {
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
        },
        zoom: Number(values.zoom),
        view: values.view,
      };

    default:
      return values satisfies never;
  }
}

export interface GetWidgetConfigFromFormValuesDeps {
  id?: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
}

function WidgetTypeField(props: FieldProps) {
  return (
    <FormField
      control={props.form.control}
      name="type"
      render={({ field }) => (
        <FormItem className="flex gap-4">
          <FormLabel>Тип виджета: </FormLabel>
          <Select
            value={field.value}
            onValueChange={(type) =>
              props.form.reset(getDefaultFormValues(type as FormValues["type"]))
            }
          >
            <FormControl>
              <SelectTrigger className="flex-1">
                <SelectValue className="text-center w-full" placeholder="Выберите тип" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(WIDGET_TYPE_LABELS).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const WIDGET_TYPE_LABELS = {
  layout: "Макет",
  title: "Заголовок",
  graph: "График",
  map: "Карта",
} as const;

function SpacingField(props: SpacingFieldProps) {
  return (
    <FormField
      control={props.form.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex gap-4">
          <FormLabel>{props.label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SPACING_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface SpacingFieldProps extends FieldProps {
  name: "columns" | "rows";
  label: string;
}

function TitleTextField(props: FieldProps) {
  return (
    <FormField
      control={props.form.control}
      name="text"
      render={({ field }) => (
        <FormItem className="flex gap-4">
          <FormLabel>Текст</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Введите заголовок" className="flex-1" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NumberTextField(props: NumberTextFieldProps) {
  return (
    <FormField
      control={props.form.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex gap-4">
          <FormLabel>{props.label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              inputMode="decimal"
              className="flex-1"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface NumberTextFieldProps extends FieldProps {
  name: "latitude" | "longitude" | "zoom";
  label: string;
}

function MapViewField(props: FieldProps) {
  return (
    <FormField
      control={props.form.control}
      name="view"
      render={({ field }) => (
        <FormItem className="flex gap-4">
          <FormLabel>Вид карты</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {MAP_VIEWS.map((view) => (
                <SelectItem key={view} value={view}>
                  {MAP_VIEW_LABELS[view]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const MAP_VIEW_LABELS = {
  scheme: "Схема",
  satellite: "Спутник",
  hybrid: "Гибрид",
} as const satisfies { [View in MapView]: string };

interface FieldProps {
  form: UseFormReturn<FormValues>;
}

const formSchema = z.discriminatedUnion("type", [
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
  return value.trim() !== "" && !Number.isNaN(number) && number >= min && number <= max;
}

type FormValues = z.infer<typeof formSchema>;
