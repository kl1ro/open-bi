import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { FieldProps } from "@/lib/widget-form";

export default function NumberTextField(props: NumberTextFieldProps) {
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
