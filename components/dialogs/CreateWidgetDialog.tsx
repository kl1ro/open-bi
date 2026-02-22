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
import { Input } from "../ui/input";

import { WIDGET_TYPE } from "@/lib/widget";
import Grid, { GridItem, SPACING_OPTIONS } from "@/lib/widgets/layouts/grid";
import { upsertWidget } from "@/state/features/dashboard";
import Void from "@/lib/widgets/void";
import { useAppDispatch } from "@/state/hooks";
import { Title } from "@/lib/widgets/title";
import { LineGraph } from "@/lib/widgets/graphs/line-graph";
import Map from "@/lib/widgets/map";

export default function CreateWidgetDialog(props: WidgetDialogProps) {
  const dispatch = useAppDispatch();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "layout",
      columns: "4",
      rows: "1",
      text: "",
    },
  });

  const { type } = form.watch();

  function onSubmit(values: FormValues) {
    if (values.type == "layout") {
      const grid: Grid & GridItem = {
        id: props.void.id,
        layout: "grid",
        type: values.type,
        columns: Number(values.columns),
        rows: Number(values.rows),
        parent: props.void.parent,
        children: [],
        position: props.void.position,
        size: props.void.size,
      };

      dispatch(upsertWidget(grid));
    } else if (values.type == "title") {
      const title: Title & GridItem = {
        id: props.void.id,
        type: values.type,
        text: values.text!,
        position: props.void.position,
        size: props.void.size,
        parent: props.void.parent,
      };

      dispatch(upsertWidget(title));
    } else if (values.type == "graph") {
      const title: LineGraph & GridItem = {
        id: props.void.id,
        type: "graph",
        graph: "line",
        position: props.void.position,
        size: props.void.size,
        parent: props.void.parent,
      };

      dispatch(upsertWidget(title));
    } else if (values.type == "map") {
      const title: Map & GridItem = {
        id: props.void.id,
        type: "map",
        position: props.void.position,
        size: props.void.size,
        parent: props.void.parent,
      };

      dispatch(upsertWidget(title));
    }
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
                      <SelectItem value="title">Заголовок</SelectItem>
                      <SelectItem value="graph">График</SelectItem>
                      <SelectItem value="map">Карта</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type == "layout" && (
              <>
                <FormField
                  control={form.control}
                  name="columns"
                  render={({ field }) => (
                    <FormItem className="flex gap-4">
                      <FormLabel>Количество столбцов</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
              </>
            )}

            {type == "title" && (
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex gap-4">
                    <FormLabel>Текст</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Введите заголовок"
                        className="flex-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

export interface WidgetDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  void: Void & GridItem;
}

const formSchema = z.object({
  type: z.enum(Object.keys(WIDGET_TYPE)),
  columns: z.enum(SPACING_OPTIONS),
  rows: z.enum(SPACING_OPTIONS),
  text: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
