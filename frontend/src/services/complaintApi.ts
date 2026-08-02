import type { ComplaintAnalysis, ComplaintRecord } from "../types/complaint";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type ApiErrorBody = {
  detail?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.detail) {
        message = body.detail;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export function analyzeComplaint(payload: { complaint_text: string; customer_name?: string; product_name?: string; batch_number?: string }): Promise<ComplaintAnalysis> {
  return request<ComplaintAnalysis>("/api/complaints/analyze", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listComplaints(): Promise<ComplaintRecord[]> {
  return request<ComplaintRecord[]>("/api/complaints");
}

export function getComplaint(id: number): Promise<ComplaintRecord> {
  return request<ComplaintRecord>(`/api/complaints/${id}`);
}

export function saveComplaint(payload: any): Promise<ComplaintRecord> {
  return request<ComplaintRecord>("/api/complaints/save", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteComplaint(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/complaints/${id}`, {
    method: "DELETE"
  });
}

export async function uploadFile(file: File): Promise<{ filename: string; content_type: string | null; extracted_text: string; warning: string | null }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE_URL}/api/complaints/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body.detail) message = body.detail;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json();
}
