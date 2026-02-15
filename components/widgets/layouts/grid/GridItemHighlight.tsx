import { cn } from "@/lib/utils";

export default function GridHighLight({ focused, available }: HighlightProps) {
  return (
    <div
      className={cn(
        "w-full h-full absolute inset-0 rounded-xl pointer-events-none animated z-20",
        (focused || available) && "ring-2",
        focused ? "ring-blue-700" : available && "ring-blue-950",
      )}
    />
  );
}

export interface HighlightProps {
  focused?: boolean;
  available?: boolean;
  resize?: number;
}
