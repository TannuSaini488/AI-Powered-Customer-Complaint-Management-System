export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type DuplicateProbability = "Unique" | "Probably Duplicate" | "Duplicate";

export type ExtractedFields = {
  customer_name: string | null;
  product_name: string | null;
  batch_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  complaint_category: string | null;
};

export type ComplaintAnalysis = {
  summary: string;
  risk_level: RiskLevel;
  risk_reason: string;
  root_cause: string;
  root_cause_reason: string;
  corrective_action: string;
  preventive_action: string;
  missing_information: string[];
  duplicate_probability: DuplicateProbability;
  confidence: number;
  extracted_fields?: ExtractedFields | null;
};

export type ComplaintRecord = {
  id: number;
  customer_name: string;
  product_name: string;
  batch_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  complaint_category: string;
  complaint_description: string;
  summary: string | null;
  risk_level: RiskLevel;
  risk_reason: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  duplicate_probability: DuplicateProbability;
  complaint_status: string;
  created_at: string;
  updated_at: string;
};
