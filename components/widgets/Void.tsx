import { useState } from "react";

import CreateWidgetDialog from "../dialogs/CreateWidgetDialog";

import { cn } from "@/lib/utils";
import type Void from "@/lib/widgets/void";
import { GridItem } from "@/lib/widgets/layouts/grid";

export function Void(props: Void) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className={cn(
          "w-full h-full",
          "flex justify-center items-center",
          "text-6xl font-bold text-muted-foreground",
          "bg-medium hover:bg-light rounded-xl select-none cursor-pointer",
          "animated",
        )}
      >
        +
      </button>
      <CreateWidgetDialog
        void={props as Void & GridItem}
        open={isFormOpen}
        setOpen={setIsFormOpen}
      />
    </>
  );
}
