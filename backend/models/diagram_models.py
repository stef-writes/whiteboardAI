from pydantic import BaseModel, validator, Field
from typing import Literal, Optional, Dict, Any
import re

class DiagramRequest(BaseModel):
    prompt: str = Field(..., description="The user prompt for diagram generation")
    mode: Literal["story", "general", "philosophy"] = Field(
        default="story", 
        description="The mode for diagram generation"
    )
    
    @validator('prompt')
    def validate_prompt(cls, v):
        if not v or not v.strip():
            raise ValueError('Prompt cannot be empty')
        
        v = v.strip()
        
        if len(v) < 5:
            raise ValueError('Prompt must be at least 5 characters long')
        
        if len(v) > 2000:
            raise ValueError('Prompt cannot exceed 2000 characters')
        
        # Check for potentially harmful content
        harmful_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'data:text/html',
        ]
        
        for pattern in harmful_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError('Prompt contains potentially harmful content')
        
        return v

class DiagramResponse(BaseModel):
    type: Literal["mindmap", "flowchart", "concept_map"]
    structure: Dict[str, Any]
    data: Dict[str, Any]
    mode: Literal["story", "general", "philosophy"]

class StructureHints(BaseModel):
    flow_direction: str = Field(default="top-down")
    anchor_node: Optional[str] = None
    
    @validator('flow_direction')
    def validate_flow_direction(cls, v):
        valid_directions = ["top-down", "left-to-right", "bottom-up", "right-to-left"]
        if v not in valid_directions:
            return "top-down"  # Default fallback
        return v

class LLMRequest(BaseModel):
    prompt: str
    system_prompt: str
    model: str = Field(default="gpt-4-turbo-preview")
    temperature: float = Field(default=0.4, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, ge=1, le=4000)
    
    @validator('model')
    def validate_model(cls, v):
        valid_models = [
            "gpt-4-turbo-preview", 
            "gpt-4", 
            "gpt-3.5-turbo"
        ]
        if v not in valid_models:
            return "gpt-4-turbo-preview"  # Default fallback
        return v 