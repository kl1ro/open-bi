"use client";

import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import MapViewField from "@/components/dialogs/create-widget/MapViewField";
import NumberTextField from "@/components/dialogs/create-widget/NumberTextField";
import SpacingField from "@/components/dialogs/create-widget/SpacingField";
import TitleTextField from "@/components/dialogs/create-widget/TitleTextField";
import WidgetTypeField from "@/components/dialogs/create-widget/WidgetTypeField";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import type WidgetConfig from "@/lib/widget";
import type { ItemConfig } from "@/lib/widget";
import {
  WIDGET_FORM_SCHEMA,
  getDefaultFormValues,
  getWidgetConfigFromFormValues,
  type WidgetFormValues,
} from "@/lib/widget-form";
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
              tryCreateWidgetFromFormValues(values, state),
            )}
            className="space-y-4 mt-4"
          >
            <WidgetTypeField form={state.form} />

            {state.type === "layout" && (
              <>
                <SpacingField
                  form={state.form}
                  name="columns"
                  label="Количество столбцов"
                />

                <SpacingField form={state.form} name="rows" label="Количество строк" />
              </>
            )}

            {state.type === "title" && <TitleTextField form={state.form} />}

            {state.type === "map" && (
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
  const form = useForm<WidgetFormValues>({
    resolver: zodResolver(WIDGET_FORM_SCHEMA),
    defaultValues: getDefaultFormValues("layout"),
  });

  return {
    form,
    type: form.watch("type"),
    dispatch: useAppDispatch(),
    id: props.id,
    parentId: props.parentId,
    itemConfig: props.itemConfig,
    close: () => props.setOpen(false),
  };
}

function tryCreateWidgetFromFormValues(
  values: WidgetFormValues,
  deps: TryCreateWidgetFromFormValuesDeps,
) {
  try {
    const widgetConfig = getWidgetConfigFromFormValues(values, deps);
    deps.dispatch(upsertWidget({ widgetConfig, itemConfig: deps.itemConfig }));
    deps.close();
  } catch (error) {
    console.error(error);
    toast.error("Не удалось создать виджет");
  }
}

interface TryCreateWidgetFromFormValuesDeps {
  dispatch: AppDispatch;
  id?: WidgetConfig["id"];
  parentId?: WidgetConfig["id"];
  itemConfig?: ItemConfig;
  close: () => void;
}
