"""
RFC 7807 Problem Details for HTTP APIs (https://datatracker.ietf.org/doc/html/rfc7807).
Guarantees consistent error structures across all AirTrack APIs.
"""
from typing import Optional, Any, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
import uuid

class ProblemException(Exception):
    def __init__(
        self,
        status_code: int,
        title: str,
        detail: str,
        code: str,
        instance: Optional[str] = None,
        errors: Optional[Any] = None
    ):
        self.status_code = status_code
        self.title = title
        self.detail = detail
        self.code = code
        self.instance = instance
        self.errors = errors
        super().__init__(detail)

def create_problem_response(
    request: Request,
    status_code: int,
    title: str,
    detail: str,
    code: str,
    errors: Optional[Any] = None
) -> JSONResponse:
    correlation_id = f"req-{uuid.uuid4().hex[:8]}"
    content: Dict[str, Any] = {
        "type": f"https://airtrack.local/errors/{code.lower().replace('_', '-')}",
        "title": title,
        "status": status_code,
        "detail": detail,
        "instance": request.url.path,
        "code": code,
        "correlationId": correlation_id,
    }
    if errors:
        content["errors"] = errors
        
    return JSONResponse(
        status_code=status_code,
        content=content,
        headers={"Content-Type": "application/problem+json"}
    )
