import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { WidgetFormFieldProps } from "@/lib/widget-form";

export default function TitleTextField(props: WidgetFormFieldProps) {
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
