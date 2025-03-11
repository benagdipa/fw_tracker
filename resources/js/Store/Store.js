import { configureStore } from "@reduxjs/toolkit";
import { MenuSlice } from "./Reducers/MenuSlice";
import { TableSlice } from "./Reducers/TableSlice";
export const store = configureStore({
  reducer: {
    menu: MenuSlice.reducer,
    table: TableSlice.reducer,
  },
});
