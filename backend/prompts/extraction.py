EXTRACTION_PROMPT = """You are a pharmaceutical QMS data extraction assistant.

Extract the following structured fields from the complaint text provided.

Return ONLY a valid JSON object with these exact keys:
{{
  "customer_name": "string or null",
  "product_name": "string or null",
  "batch_number": "string or null",
  "manufacturing_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "complaint_category": "one of: Broken Tablets | Incorrect Labeling | Leakage | Damaged Packaging | Color Variation | Wrong Medicine Received | Foreign Particles | Expired Medicine | Other"
}}

Rules:
- If a field is not mentioned in the text, return null for that field.
- For dates, try to parse them to YYYY-MM-DD format. If only month/year is given, use the 1st as the day.
- For complaint_category, pick the closest match from the list above based on the complaint description.
- Return ONLY the JSON object. No explanation, no markdown, no code blocks, and no python code.

Complaint text:
{complaint_text}
"""
