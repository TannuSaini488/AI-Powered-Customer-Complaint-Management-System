import io
import logging

from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from sqlalchemy import desc, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from langgraph.workflow import run_complaint_workflow
from models.complaint import Complaint
from schemas.complaint import (
    ComplaintAnalyzeRequest,
    ComplaintAnalysisResponse,
    ComplaintCreate,
    UploadResponse,
)
from services.mock_analysis_service import analyze_with_mock_rules
from services.groq_client import GroqAnalysisError

logger = logging.getLogger(__name__)


class ComplaintService:
    def analyze(self, payload: ComplaintAnalyzeRequest) -> ComplaintAnalysisResponse:
        try:
            return run_complaint_workflow(payload)
        except GroqAnalysisError as exc:
            if "GROQ_API_KEY is not configured" in str(exc):
                logger.warning("LangGraph analysis failed (no API key); returning safe rule-based fallback: %s", exc)
                return analyze_with_mock_rules(payload)
            else:
                logger.error("Groq API timeout or failure: %s", exc)
                raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=f"AI service unavailable: {exc}")
        except Exception as exc:
            logger.error("Unexpected error in analysis workflow: %s", exc)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during analysis.")

    def save(self, db: Session, payload: ComplaintCreate) -> Complaint:
        try:
            complaint = Complaint(**payload.model_dump())
            db.add(complaint)
            db.commit()
            db.refresh(complaint)
            return complaint
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error("Database save error: %s", exc)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save complaint to database.")

    def list_all(self, db: Session) -> list[Complaint]:
        try:
            statement = select(Complaint).order_by(desc(Complaint.created_at))
            return list(db.scalars(statement).all())
        except SQLAlchemyError as exc:
            logger.error("Database read error: %s", exc)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch complaints.")

    def get(self, db: Session, complaint_id: int) -> Complaint | None:
        try:
            return db.get(Complaint, complaint_id)
        except SQLAlchemyError as exc:
            logger.error("Database read error for ID %d: %s", complaint_id, exc)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch complaint.")

    def delete(self, db: Session, complaint_id: int) -> bool:
        try:
            complaint = self.get(db, complaint_id)
            if complaint is None:
                return False
            db.delete(complaint)
            db.commit()
            return True
        except SQLAlchemyError as exc:
            db.rollback()
            logger.error("Database delete error for ID %d: %s", complaint_id, exc)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete complaint.")

    async def extract_upload(self, file: UploadFile) -> UploadResponse:
        content = await file.read()
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        content_type = file.content_type
        extracted_text = ""
        warning = None

        if content_type and "text" in content_type:
            extracted_text = content.decode("utf-8", errors="ignore")
        elif file.filename.lower().endswith(".pdf") or (content_type and "pdf" in content_type):
            try:
                pdf_reader = PdfReader(io.BytesIO(content))
                pages_text = []
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
                extracted_text = "\n".join(pages_text).strip()
                if not extracted_text:
                    warning = "PDF appears to be empty or contains only unextractable images."
            except PdfReadError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid or corrupted PDF file.",
                )
            except Exception as e:
                logger.error("Failed to parse PDF: %s", e)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="An error occurred while processing the PDF.",
                )
        elif content_type and content_type.startswith("image/"):
            warning = "Image upload received. Production OCR is outside scope; manual review may be required."
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type.",
            )

        return UploadResponse(
            filename=file.filename,
            content_type=content_type,
            extracted_text=extracted_text,
            warning=warning,
        )


complaint_service = ComplaintService()
