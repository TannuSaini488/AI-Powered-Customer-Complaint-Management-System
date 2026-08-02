import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
};

type UiState = {
  sidebarOpen: boolean;
  globalLoading: boolean;
  toasts: ToastMessage[];
};

const initialState: UiState = {
  sidebarOpen: true,
  globalLoading: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    addToast(state, action: PayloadAction<Omit<ToastMessage, "id">>) {
      state.toasts.push({
        ...action.payload,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setGlobalLoading, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
