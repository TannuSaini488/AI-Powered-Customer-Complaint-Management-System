import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { ComplaintRecord } from "../../types/complaint";

type ComplaintsState = {
  records: ComplaintRecord[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: ComplaintsState = {
  records: [],
  status: "idle",
  error: null
};

const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    setLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setRecords(state, action: PayloadAction<ComplaintRecord[]>) {
      state.records = action.payload;
      state.status = "succeeded";
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
    removeRecord(state, action: PayloadAction<number>) {
      state.records = state.records.filter((r) => r.id !== action.payload);
    }
  }
});

export const { setError, setLoading, setRecords, removeRecord } = complaintsSlice.actions;
export default complaintsSlice.reducer;
