import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import analysisReducer from "../features/complaints/analysisSlice";
import complaintsReducer from "../features/complaints/complaintsSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import uiReducer from "../features/ui/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
    analysis: analysisReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
