from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.complaint import (
    ComplaintAnalyzeRequest,
    ComplaintAnalysisResponse,
    ComplaintCreate,
    ComplaintResponse,
    UploadResponse,
)
from services.complaint_service import complaint_service


router = APIRouter()


@router.post("/analyze", response_model=ComplaintAnalysisResponse)
def analyze_complaint(payload: ComplaintAnalyzeRequest) -> ComplaintAnalysisResponse:
    if not payload.complaint_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint text cannot be empty.",
        )
    return complaint_service.analyze(payload)


@router.post("/save", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def save_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)) -> ComplaintResponse:
    return complaint_service.save(db, payload)


@router.post("/upload", response_model=UploadResponse)
async def upload_complaint(file: UploadFile) -> UploadResponse:
    return await complaint_service.extract_upload(file)


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(db: Session = Depends(get_db)) -> list[ComplaintResponse]:
    return complaint_service.list_all(db)


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)) -> ComplaintResponse:
    complaint = complaint_service.get(db, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")
    return complaint


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)) -> None:
    deleted = complaint_service.delete(db, complaint_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")
