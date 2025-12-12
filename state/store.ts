import { configureStore } from "@reduxjs/toolkit";

import widget from "./features/widget";

export const store = configureStore({
  reducer: {
    widget,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
