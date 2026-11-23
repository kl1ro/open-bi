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
import { SPACING_OPTIONS } from "@/lib/widgets/layouts/grid";

export default function SpacingField(props: SpacingFieldProps) {
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

interface SpacingFieldProps extends WidgetFormFieldProps {
  name: "columns" | "rows";
  label: string;
}
