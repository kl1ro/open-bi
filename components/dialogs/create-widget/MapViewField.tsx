import {
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
import type { WidgetFormFieldProps } from "@/lib/widget-form";
import { MAP_VIEWS, type MapView } from "@/lib/widgets/map";

export default function MapViewField(props: WidgetFormFieldProps) {
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
