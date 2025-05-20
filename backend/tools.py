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

def generate_diagram(prompt: str) -> dict:
    # Step 1: Preprocess the prompt to get structure hints
    structure_hints = analyze_concepts_and_structure(prompt)

    # Step 2: Classify diagram type
    diagram_type = classify_prompt(prompt)

    generators = {
        "mindmap": generate_mindmap,
        "flowchart": generate_flowchart,
        "concept_map": generate_concept_map
    }

    if diagram_type not in generators:
        raise HTTPException(status_code=400, detail=f"Unknown diagram type: {diagram_type}")

    # Step 3: Pass structure hints into the generator
    return {
        "type": diagram_type,
        "structure": structure_hints,
        "data": generators[diagram_type](prompt, structure_hints)
    }

def classify_prompt(prompt: str) -> str:
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
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": classifier_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=10
    )
    return response.choices[0].message.content.strip().lower()

def generate_mindmap(prompt: str, hints: dict = None) -> dict:
    system = """
You are a story mindmap architect. Create JSON with:

**Structure:**
- root: Core story concept (max 3 words)
- branches: 3-5 key categories (Characters, Themes, etc.)
- subtopics: Specific elements per category
- layout: radial

**Rules:**
1. Include at least 3 sub-items per branch
2. Prioritize elements from analysis: {hints}
3. Use concise, evocative labels
4. Ensure all items relate to root

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
""".format(hints=json.dumps(hints if hints else {}, indent=2))

    user_content = f"Create mindmap for: {prompt}\nAnalyzed Elements:\n{json.dumps(hints if hints else {}, indent=2)}"
    return _ask_llm_with_content(user_content, system)

def generate_flowchart(prompt: str, hints: dict = None) -> dict:
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
4. Highlight elements from: {hints}

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
""".format(hints=json.dumps(hints if hints else {}, indent=2))

    user_content = f"Create flowchart for: {prompt}\nKey Events:\n{json.dumps(hints if hints else {}, indent=2)}"
    return _ask_llm_with_content(user_content, system)

def generate_concept_map(prompt: str, hints: dict = None) -> dict:
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
4. Incorporate: {hints}

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
""".format(hints=json.dumps(hints if hints else {}, indent=2))

    user_content = f"Create concept map for: {prompt}\nRelationships:\n{json.dumps(hints if hints else {}, indent=2)}"
    return _ask_llm_with_content(user_content, system)

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