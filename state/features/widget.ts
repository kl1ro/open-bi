import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

import Widget, { NonEmptyWidget, prepareWidget } from "@/lib/widget";
import { GridItem } from "@/lib/widgets/layouts/grid";

export const rootWidget: WidgetState = {
  value: {
    id: uuid(),
    type: "layout",
    layout: "grid",
    rows: 1,
    columns: 1,
    children: [
      {
        id: uuid(),
        type: "void",
        position: { column: 1, row: 1 },
        size: { colSpan: 1, rowSpan: 1 },
      } as GridItem,
    ],
  },
};

interface WidgetState {
  value: Widget;
}

const slice = createSlice({
  name: "widget",
  initialState: rootWidget,
  reducers: {
    upsertWidget: handleWidgetUpsert,
  },
});

export const { upsertWidget } = slice.actions;
export default slice.reducer;

function handleWidgetUpsert(state: WidgetState, action: PayloadAction<Widget>) {
  const { value: root } = state;

  const widget =
    action.payload.type != "void"
      ? prepareWidget(action.payload)
      : action.payload;

  let parent = findLeaf(root, widget.parent) as NonEmptyWidget | undefined;

  if (!parent) {
    state.value = widget;
    return;
  }

  widget.parent = { ...parent, children: undefined };

  const index = parent.children!.findIndex((child) => child.id == widget.id);
  parent.children![index] = widget;
  parent = prepareWidget(parent);
}

function findLeaf(suspect: Widget, target?: Widget): Widget | undefined {
  if (!target) return undefined;
  if (suspect.id === target.id) return suspect;
  if (!suspect.children?.length) return undefined;

  for (const child of suspect.children) {
    const found = findLeaf(child, target);
    if (found) return found;
  }

  return undefined;
}
