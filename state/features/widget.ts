import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import Widget, { NonEmptyWidget } from "@/lib/widgets/widget";

export const rootWidget: WidgetState = {
  value: {
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
  const widget = action.payload;
  const parent = findLeaf(root, widget.parent) as NonEmptyWidget | undefined;

  if (!parent) {
    state.value = widget;
    return;
  }

  widget.parent = { ...parent };

  parent.children = [
    ...parent.children.filter((child) => child.id != widget.id),
    widget,
  ];
}

function findLeaf(suspect: Widget, target?: Widget): Widget | undefined {
  if (!suspect.type || !target) return;
  if (suspect?.id == target.id) return suspect;
  if (!suspect.children.length) return;
  return suspect.children.find((child) => findLeaf(child, target));
}
