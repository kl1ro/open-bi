import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

import Widget, { NonEmptyWidget, prepareWidget } from "@/lib/widget";

export const rootWidget: WidgetState = {
  value: {
    id: uuid(),
    type: "void",
    size: { colSpan: 1, rowSpan: 1 },
    position: { row: 1, column: 1 },
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
  const widget = prepareWidget(action.payload);
  const parent = findLeaf(root, widget.parent) as NonEmptyWidget | undefined;

  if (!parent) {
    state.value = widget;
    return;
  }

  widget.parent = { ...parent, children: undefined };

  const index = parent.children!.findIndex((child) => child.id == widget.id);
  parent.children![index] = widget;
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
