import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type DashboardMetrics = {
  total: number;
  open: number;
  closed: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  critical: number;
};

type DashboardState = {
  metrics: DashboardMetrics | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: DashboardState = {
  metrics: null,
  status: "idle",
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setDashboardLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setDashboardMetrics(state, action: PayloadAction<DashboardMetrics>) {
      state.metrics = action.payload;
      state.status = "succeeded";
    },
    setDashboardError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const { setDashboardLoading, setDashboardMetrics, setDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
