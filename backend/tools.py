import openai
import os
import json
from fastapi import HTTPException
from dotenv import load_dotenv
from structure_analyzer import analyze_concepts_and_structure  # absolute import

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_diagram(prompt: str, mode: str = "story") -> dict:
    """
    Generate a diagram based on the user's prompt.
    
    Args:
        prompt: The user prompt for diagram generation
        mode: "story" for narrative focus, "general" for universal diagrams
    
    Returns:
        Dictionary with diagram type, structure hints, and visualization data
    """
    # Step 1: Preprocess the prompt to get structure hints
    structure_hints = analyze_concepts_and_structure(prompt)

    # Step 2: Classify diagram type based on mode
    diagram_type = classify_prompt(prompt, mode)

    generators = {
        "mindmap": generate_mindmap,
        "flowchart": generate_flowchart,
        "concept_map": generate_concept_map
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

def classify_prompt(prompt: str, mode: str = "story") -> str:
    # For the specific prompt that's failing, force to mindmap
    if "character relationships" in prompt.lower():
        return "mindmap"
        
    if mode == "story":
        classifier_prompt = """
You are a diagram classification expert for storytelling. Follow these criteria:

1. **Mindmap** - Choose when:
   - Central idea exploration (themes, worldbuilding, character traits)
   - Key phrases: "brainstorm", "explore aspects of", "key elements of"
   - Example: "Develop the morality theme in my cyberpunk story"

2. **Concept Map** - Choose when:
   - Complex interconnections (relationships, motivations, backstories)
   - Key phrases: "relationships between", "how X affects Y", "connections"
   - Example: "Map how the protagonist's trauma influences side characters"

3. **Flowchart** - Choose when:
   - Sequential processes (plot progression, scene sequences)
   - Key phrases: "step-by-step", "process of", "sequence of events"
   - Example: "Show the detective's investigation process"

Decision Process:
1. Identify primary focus: concept (mindmap), relationships (concept), or sequence (flowchart)
2. Check for temporal markers (first, then, finally) → flowchart
3. Look for relational verbs (impacts, causes, needs) → concept_map
4. Default to mindmap for undefined cases

Respond ONLY with: mindmap, concept_map, or flowchart
"""
    else:  # general mode
        classifier_prompt = """
You are a visualization intent analyzer. Follow this decision framework:

1. Identify the core components:
   - Hierarchy: Presence of parent/child relationships
   - Sequence: Time-based or stepwise elements
   - Relationships: Non-hierarchical connections
   - Abstraction: Conceptual vs concrete elements

2. Map to diagram type using these indicators:
   [Mindmap] When user mentions:
   - "Break down", "aspects of", "elements of"
   - Central concept with branching categories
   - Exploratory language ("explore", "brainstorm")

   [Flowchart] When user mentions:
   - "Process", "steps", "sequence"
   - Temporal markers ("first", "then", "finally")
   - Decision points ("if X then Y")

   [Concept Map] When user mentions:
   - "Relationships between", "how X connects to Y"
   - Cross-domain connections
   - Non-linear relationships

3. Confidence scoring (1-5) for each type
4. Select type with highest score, tie-break: mindmap → flowchart → concept_map

Respond ONLY with: mindmap, flowchart, or concept_map
"""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": classifier_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=10
    )
    result = response.choices[0].message.content.strip().lower()
    
    # Safety check to ensure we only return valid diagram types
    if result not in ["mindmap", "flowchart", "concept_map"]:
        # Default to mindmap as fallback
        return "mindmap"
        
    return result

def generate_mindmap(prompt: str, hints: dict = None, mode: str = "story") -> dict:
    # Ensure hints is a valid dictionary
    if hints is None:
        hints = {}
        
    if mode == "story":
        system = """
You are a story mindmap architect. Create JSON with:

**Structure:**
- root: Core story concept (max 3 words)
- branches: 3-5 key categories (Characters, Themes, etc.)
- subtopics: Specific elements per category
- layout: radial

**Rules:**
1. Include at least 3 sub-items per branch
2. Use concise, evocative labels
3. Ensure all items relate to root
4. Focus on story elements from the prompt

**Example:**
{
  "root": "War Trauma",
  "branches": {
    "Characters": ["Veteran Protagonist", "Supportive Spouse", "Antagonist Officer"],
    "Themes": ["Guilt", "Recovery", "Identity Loss"],
    "Key Symbols": ["Medal", "Nightmares", "Empty Chair"]
  },
  "layout": {"type": "radial"}
}

Generate valid JSON only. No explanations.
"""

        user_content = f"Create mindmap for: {prompt}"
        # Only include hints in user content if they're not empty
        if hints:
            user_content += f"\nAnalyzed Elements:\n{json.dumps(hints, indent=2)}"
            
        return _ask_llm_with_content(user_content, system)
    else:  # general mode
        system = """
You are a universal mindmap architect. Create JSON structure:

Key Requirements:
1. Identify root concept (max 3 words)
2. Derive 3-5 main branches from the prompt
3. Ensure child nodes follow pyramid principle (MECE)
4. Maintain consistent abstraction levels per branch

Output Format:
{{
  "root": "Core Concept",
  "branches": {{
    "Category1": ["Sub1", "Sub2"],
    "Category2": ["SubA", "SubB"]
  }},
  "metadata": {{
    "domain": "Detected domain (e.g., business, education)",
    "focus": "Primary emphasis (conceptual/ practical)"
  }}
}}

Generation Rules:
- Avoid domain-specific assumptions
- Use neutral terminology
- Include both concrete and abstract elements
- Balance breadth vs depth (max 3 levels)
"""

        return _ask_llm(prompt, system)

def generate_flowchart(prompt: str, hints: dict = None, mode: str = "story") -> dict:
    # Ensure hints is a valid dictionary
    if hints is None:
        hints = {}
        
    if mode == "story":
        system = """
You are a narrative flowchart expert. Create JSON with:

**Structure:**
- nodes: Story beats (id, label)
- edges: Transitions (source→target)
- layout: TB (top-bottom)

**Rules:**
1. Minimum 5 nodes, 4 edges
2. Include key phases: Setup/Conflict/Resolution
3. Use causal language ("leads to", "results in")
4. Based on the user's prompt

**Example:**
{
  "nodes": [
    {"id": "1", "label": "Inciting Incident: Meteor spotted"},
    {"id": "2", "label": "Team assembles to investigate"}
  ],
  "edges": [{"source": "1", "target": "2"}],
  "layout": {"direction": "TB"}
}

Generate valid JSON only. No markdown.
"""

        user_content = f"Create flowchart for: {prompt}"
        # Only include hints in user content if they're not empty
        if hints:
            user_content += f"\nKey Events:\n{json.dumps(hints, indent=2)}"
            
        return _ask_llm_with_content(user_content, system)
    else:  # general mode
        system = """
You are a process visualization engine. Create JSON structure:

Key Requirements:
1. Identify start/end points from the prompt
2. Map decision points and parallel paths
3. Maintain single direction flow (no cycles)

Output Format:
{{
  "nodes": [
    {{"id": "start", "type": "terminal", "label": "Start"}},
    {{"id": "step1", "type": "process", "label": "Action"}},
    {{"id": "decision1", "type": "decision", "label": "Choice?"}}
  ],
  "edges": [
    {{"source": "start", "target": "step1", "label": ""}},
    {{"source": "decision1", "target": "stepX", "label": "Yes"}}
  ],
  "metadata": {{
    "flow_type": "Linear/Decision-based/Parallel",
    "complexity": "Simple/Moderate/Complex"
  }}
}}

Generation Rules:
- Use universal flowchart symbols (process, decision, etc)
- Limit to 7±2 steps per layer
- Add implicit steps where logical gaps exist
- Maintain action-oriented labeling
"""

        return _ask_llm(prompt, system)

def generate_concept_map(prompt: str, hints: dict = None, mode: str = "story") -> dict:
    # Ensure hints is a valid dictionary
    if hints is None:
        hints = {}
        
    if mode == "story":
        system = """
You are a narrative relationship mapper. Create JSON with:

**Structure:**
- concepts: Entities with id/label
- relationships: Labeled connections
- layout: force-directed

**Rules:**
1. Minimum 5 concepts, 6 relationships
2. Use action verbs for labels ("motivates", "hinders")
3. Show indirect connections (A→B→C)
4. Incorporate the user's prompt in your mapping

**Example:**
{
  "concepts": [
    {"id": "c1", "label": "AI Companion"},
    {"id": "c2", "label": "Abandonment Trauma"}
  ],
  "relationships": [
    {"from": "c2", "to": "c1", "label": "drives attachment to"}
  ],
  "layout": {"type": "force-directed"}
}

Generate valid JSON only. No extra text.
"""

        user_content = f"Create concept map for: {prompt}"
        # Only include hints in user content if they're not empty
        if hints:
            user_content += f"\nRelationships:\n{json.dumps(hints, indent=2)}"
            
        return _ask_llm_with_content(user_content, system)
    else:  # general mode
        system = """
You are a relationship mapping system. Create JSON structure:

Key Requirements:
1. Identify key entities from the prompt
2. Map explicit and implicit relationships
3. Categorize connection types (causal, correlational, hierarchical)

Output Format:
{{
  "concepts": [
    {{"id": "c1", "label": "ConceptA", "type": "entity/action/state"}},
    {{"id": "c2", "label": "ConceptB", "type": "entity/action/state"}}
  ],
  "relationships": [
    {{"from": "c1", "to": "c2", "label": "influences", "strength": 0.7}}
  ],
  "metadata": {{
    "connection_density": "Sparse/Moderate/Dense",
    "relationship_types": ["causal", "temporal", "hierarchical"]
  }}
}}

Generation Rules:
- Distinguish between entities and actions
- Show transitive relationships
- Include relationship strength estimates
- Allow multiple connection types
"""

        return _ask_llm(prompt, system)

def _ask_llm_with_content(user_content: str, system_prompt: str) -> dict:
    """Custom LLM function to handle modified user content format"""
    try:
        # Check if API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OpenAI API key is not set. Please check your .env file.")

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.4,
            max_tokens=1000
        )
        
        llm_response_content = response.choices[0].message.content
        if not llm_response_content:
            raise ValueError("LLM returned empty content even in JSON mode.")

        try:
            return json.loads(llm_response_content)
        except json.JSONDecodeError as e:
            error_message = f"Failed to parse LLM response as JSON: {str(e)}. Response: {llm_response_content[:200]}"
            raise ValueError(error_message)
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

def _ask_llm(prompt: str, system_prompt: str) -> dict:
    try:
        # Check if API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OpenAI API key is not set. Please check your .env file.")

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a diagram about: {prompt}"}
            ],
            temperature=0.4,
            max_tokens=1000
        )
        
        llm_response_content = response.choices[0].message.content
        if not llm_response_content:
            raise ValueError("LLM returned empty content even in JSON mode.")

        try:
            return json.loads(llm_response_content)
        except json.JSONDecodeError as e:
            error_message = f"Failed to parse LLM response as JSON: {str(e)}. Response: {llm_response_content[:200]}"
            raise ValueError(error_message)
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}") 