from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from tools import generate_diagram
from models.diagram_models import DiagramRequest, DiagramResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ideation Space API",
    description="Backend API for generating various types of diagrams",
    version="1.0.0"
)

# Add CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
async def root():
    return {"message": "Ideation Space backend is running"}

@app.post("/api/generate-diagram", response_model=DiagramResponse)
async def get_diagram(request: DiagramRequest):
    try:
        logger.info(f"Received request with prompt: {request.prompt[:100]}..., mode: {request.mode}")
        
        logger.info(f"Generating diagram in {request.mode} mode...")
        result = generate_diagram(request.prompt, request.mode)
        logger.info(f"Diagram generated successfully: type={result.get('type')}")
        
        # Validate response using Pydantic model
        validated_response = DiagramResponse(**result)
        return validated_response
        
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except HTTPException as e:
        # Re-raise HTTP exceptions as-is
        logger.error(f"HTTP error: {str(e.detail)}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error generating diagram: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "Ideation Space API"}

if __name__ == "__main__":
    import uvicorn
    HOST = "127.0.0.1"  # localhost
    PORT = 3001  # Changed from 3000 to avoid port conflict
    
    logger.info(f"Starting Ideation Space server on http://{HOST}:{PORT}")
    logger.info("Press CTRL+C to quit")
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info"
    )
