import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ComplaintAnalysis } from "../../types/complaint";

type AnalysisState = {
  currentAnalysis: ComplaintAnalysis | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  extractedText: string | null;
  warning: string | null;
};

const initialState: AnalysisState = {
  currentAnalysis: null,
  status: "idle",
  error: null,
  extractedText: null,
  warning: null,
};

const analysisSlice = createSlice({
  name: "analysis",
  initialState,
  reducers: {
    setAnalysisLoading(state) {
      state.status = "loading";
      state.error = null;
      state.warning = null;
    },
    setAnalysisResult(state, action: PayloadAction<ComplaintAnalysis>) {
      state.currentAnalysis = action.payload;
      state.status = "succeeded";
    },
    setAnalysisError(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
    setExtractedText(state, action: PayloadAction<{ text: string; warning?: string | null }>) {
      state.extractedText = action.payload.text;
      state.warning = action.payload.warning || null;
    },
    resetAnalysis(state) {
      state.currentAnalysis = null;
      state.status = "idle";
      state.error = null;
      state.extractedText = null;
      state.warning = null;
    },
  },
});

export const { setAnalysisLoading, setAnalysisResult, setAnalysisError, setExtractedText, resetAnalysis } = analysisSlice.actions;
export default analysisSlice.reducer;
