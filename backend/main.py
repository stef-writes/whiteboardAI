from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tools import generate_diagram
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class PromptRequest(BaseModel):
    prompt: str
    mode: str = "story"  # Default to story mode, but allow general mode

@app.get("/")
async def root():
    return {"message": "Whiteboard AI backend is running"}

@app.post("/api/generate-diagram")
async def get_diagram(prompt_req: PromptRequest):
    try:
        logger.info(f"Received request with prompt: {prompt_req.prompt}, mode: {prompt_req.mode}")
        
        if not prompt_req.prompt:
            logger.error("Empty prompt received")
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        # Validate mode
        if prompt_req.mode not in ["story", "general"]:
            logger.warning(f"Invalid mode received: {prompt_req.mode}, defaulting to 'story'")
            mode = "story"
        else:
            mode = prompt_req.mode
            
        logger.info(f"Generating diagram in {mode} mode...")
        result = generate_diagram(prompt_req.prompt, mode)
        logger.info(f"Diagram generated successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Error generating diagram: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    HOST = "127.0.0.1"  # localhost
    PORT = 3001  # Changed from 3000 to avoid port conflict
    
    logger.info(f"Starting server on http://{HOST}:{PORT}")
    logger.info("Press CTRL+C to quit")
    
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info"
    )
