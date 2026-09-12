from fastapi import FastAPI, status
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


app = FastAPI(
    title="Demo FastAPI Service",
    description="A demo FastAPI application featuring health check monitoring.",
    version="1.0.0",
)


@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Root endpoint",
    tags=["General"],
)
async def read_root() -> dict[str, str]:
    """Return a welcome message."""
    return {"message": "Welcome to the Demo FastAPI Service"}


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check Endpoint",
    tags=["Health"],
)
async def health_check() -> HealthResponse:
    """Health check endpoint to verify service operational status."""
    return HealthResponse(status="healthy")
