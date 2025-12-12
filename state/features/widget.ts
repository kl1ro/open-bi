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
    appendWidget: handleWidgetAppend,
    updateWidget: handleWidgetUpdate,
  },
});

export const { appendWidget, updateWidget } = slice.actions;
export default slice.reducer;

function handleWidgetAppend(
  state: WidgetState,
  action: PayloadAction<WidgetCreationProps>,
) {
  const { appendTo, widget } = action.payload;
  const { value: root } = state;

  const leaf = findLeaf(root, appendTo);

  if (!leaf) state.value = widget;
  else {
    widget.parent = { ...leaf };
    leaf.children = [...leaf.children, widget];
  }
}

export interface WidgetCreationProps {
  appendTo: Widget;
  widget: NonEmptyWidget;
}

function findLeaf(
  suspect: Widget,
  target?: Widget,
): NonEmptyWidget | undefined {
  if (!suspect.type || !target) return;
  if (suspect?.id == target.id) return suspect;
  if (!suspect.children.length) return;
  return suspect.children.find((child) => findLeaf(child, target));
}

function handleWidgetUpdate(
  state: WidgetState,
  action: PayloadAction<WidgetUpdateProps>,
) {
  const { value: root } = state;
  const widget = action.payload.widget;
  const parent = findLeaf(root, widget.parent);

  if (!parent) {
    state.value = widget;
    return;
  }

  parent.children = [
    ...parent.children.filter((child) => child.id != widget.id),
    widget,
  ];
}

export interface WidgetUpdateProps {
  widget: NonEmptyWidget;
}
