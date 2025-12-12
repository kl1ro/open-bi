import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

import Widget, { NonEmptyWidgetType, WIDGET_TYPE } from "@/lib/widgets/widget";
import { SPACING_OPTIONS } from "@/lib/grid";
import { appendWidget } from "@/state/features/widget";
import Void from "@/lib/widgets/void";
import { useAppDispatch } from "@/state/hooks";
import { Grid } from "@/lib/widgets/layout";

export default function CreateWidgetDialog(props: WidgetDialogProps) {
  const dispatch = useAppDispatch();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "layout",
      columns: "4",
      rows: "1",
    },
  });

  function onSubmit(values: FormValues) {
    const grid: Grid = {
      id: Math.round(Math.random() * 1000000000),
      layout: "grid",
      type: values.type as NonEmptyWidgetType,
      columns: Number(values.columns),
      rows: Number(values.rows),
      children: [],
      position: props.void.position,
      size: props.void.size,
    };

    dispatch(
      appendWidget({ widget: grid, appendTo: props.void.parent as Widget }),
    );
    props.setOpen(false);
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => !open && props.setOpen(open)}
    >
      <DialogContent className="bg-medium border-light text-secondary">
        <DialogTitle>Создайте виджет дэшборда</DialogTitle>
        <DialogDescription />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="flex gap-4">
                  <FormLabel>Тип виджета: </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue
                          className="text-center w-full"
                          placeholder="Выберите тип"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="layout">Макет</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="columns"
              render={({ field }) => (
                <FormItem className="flex gap-4">
                  <FormLabel>Количество столбцов</FormLabel>
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

            <FormField
              control={form.control}
              name="rows"
              render={({ field }) => (
                <FormItem className="flex gap-4">
                  <FormLabel>Количество строк</FormLabel>
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

export interface WidgetDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  void: Void;
}

const formSchema = z.object({
  type: z.enum(Object.keys(WIDGET_TYPE)),
  columns: z.enum(SPACING_OPTIONS),
  rows: z.enum(SPACING_OPTIONS),
});

type FormValues = z.infer<typeof formSchema>;
