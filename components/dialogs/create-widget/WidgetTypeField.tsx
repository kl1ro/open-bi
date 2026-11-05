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
import {
  type FormValues,
  type FieldProps,
  getDefaultFormValues,
} from "@/lib/widget-form";

export default function WidgetTypeField(props: FieldProps) {
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
              isFormType(type) && props.form.reset(getDefaultFormValues(type))
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
} as const satisfies { [Type in FormValues["type"]]: string };

function isFormType(type: string): type is FormValues["type"] {
  return Object.hasOwn(WIDGET_TYPE_LABELS, type);
}
