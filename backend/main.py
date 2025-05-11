from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tools import generate_diagram

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

@app.post("/api/generate-diagram")
async def get_diagram(prompt_req: PromptRequest):
    try:
        if not prompt_req.prompt:
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        result = generate_diagram(prompt_req.prompt)
        return result
    except Exception as e:
        print(f"Error generating diagram: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
