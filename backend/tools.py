import json
from fastapi import HTTPException
from structure_analyzer import analyze_concepts_and_structure
from services.llm_service import llm_service
from models.diagram_models import DiagramResponse

def generate_diagram(prompt: str, mode: str = "story") -> dict:
    """
    Generate a diagram based on the user's prompt.
    
    Args:
        prompt: The user prompt for diagram generation
        mode: "story" for narrative focus, "general" for universal diagrams, "philosophy" for conceptual lattices
    
    Returns:
        Dictionary with diagram type, structure hints, and visualization data
    """
    # Step 1: Preprocess the prompt to get structure hints
    structure_hints = analyze_concepts_and_structure(prompt)

    # Step 2: Classify diagram type based on mode
    diagram_type = llm_service.classify_prompt(prompt, mode)

    generators = {
        "mindmap": generate_mindmap,
        "flowchart": generate_flowchart,
        "concept_map": generate_concept_map
    }
    
    # For philosophy mode, we always use a specialized concept map
    if mode == "philosophy":
        return {
            "type": "concept_map",  # We'll use concept map visualization for philosophy mode
            "structure": structure_hints,
            "data": llm_service.generate_philosophy_diagram(prompt),
            "mode": mode
        }
    
    if diagram_type not in generators:
        raise HTTPException(status_code=400, detail=f"Unknown diagram type: {diagram_type}")

    # Step 3: Pass structure hints and mode into the generator
    return {
        "type": diagram_type,
        "structure": structure_hints,
        "data": generators[diagram_type](prompt, structure_hints, mode),
        "mode": mode
    }

def generate_mindmap(prompt: str, hints: dict = None, mode: str = "story") -> dict:
    """Generate mindmap using the LLM service"""
    if hints is None:
        hints = {}
        
    try:
        system_prompt = llm_service.get_system_prompt('mindmap', f'{mode}_mode')
        
        user_content = f"Create mindmap for: {prompt}"
        if hints:
            user_content += f"\nAnalyzed Elements:\n{json.dumps(hints, indent=2)}"
            
        return llm_service.generate_json(user_content, system_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mindmap: {str(e)}")

def generate_flowchart(prompt: str, hints: dict = None, mode: str = "story") -> dict:
    """Generate flowchart using the LLM service"""
    if hints is None:
        hints = {}
        
    try:
        system_prompt = llm_service.get_system_prompt('flowchart', f'{mode}_mode')
        
        user_content = f"Create flowchart for: {prompt}"
        if hints:
            user_content += f"\nKey Events:\n{json.dumps(hints, indent=2)}"
            
        return llm_service.generate_json(user_content, system_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flowchart: {str(e)}")

def generate_concept_map(prompt: str, hints: dict = None, mode: str = "story") -> dict:
    """Generate concept map using the LLM service"""
    if hints is None:
        hints = {}
        
    try:
        system_prompt = llm_service.get_system_prompt('concept_map', f'{mode}_mode')
        
        user_content = f"Create concept map for: {prompt}"
        if hints:
            user_content += f"\nRelationships:\n{json.dumps(hints, indent=2)}"
            
        return llm_service.generate_json(user_content, system_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating concept map: {str(e)}") 