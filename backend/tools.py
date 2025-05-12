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

def classify_prompt(prompt: str) -> str:
    classifier_prompt = """
You are a diagram classification engine.
Given a user's prompt, respond ONLY with one of the following diagram types:
- "mindmap"
- "concept_map"
- "flowchart"

Respond with ONLY the type, no other text.
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

    # Step 3: Pass structure hints into the generator (optional; see below)
    return {
        "type": diagram_type,
        "structure": structure_hints,
        "data": generators[diagram_type](prompt, structure_hints)  # <- update generators to accept hints
    }

def generate_mindmap(prompt: str, hints: dict = None) -> dict:
    # ... use hints in the future if needed ...
    system = """You are an expert mind map generation engine.
Your goal is to create a well-structured and informative mind map in JSON format.

JSON Structure:
{
    "root": "Central Topic/Idea derived from the user's prompt",
    "branches": {
        "Main Branch 1": ["Sub-topic 1.1", "Sub-topic 1.2", "Sub-topic 1.3"],
        "Main Branch 2": ["Sub-topic 2.1", "Sub-topic 2.2"],
        "Main Branch 3": ["Sub-topic 3.1", "Sub-topic 3.2", "Sub-topic 3.3", "Sub-topic 3.4"]
    },
    "layout": {
        "type": "radial",
        "radius": 250, // Base radius for main branches
        "center": {"x": 500, "y": 400}, // Canvas center
        "spacing": {
            "branch": 100, // Additional radial distance for sub-topics from their branch node
            "subitem": 70   // Spacing between sub-items if they were to be arranged linearly (less critical for pure radial)
        }
    }
}

Instructions:
1.  The "root" should clearly state the main subject of the mind map.
2.  "branches" should be an object where each key is a major theme or category related to the root.
3.  Each main branch should have an array of 2-5 descriptive "sub-topics" or key points.
4.  Ensure the content is logically organized, with clear hierarchical relationships.
5.  The layout parameters provided are suggestions; adjust them if the content complexity warrants it for clarity, but maintain the radial type.
6.  Focus on creating a balanced and easy-to-understand mind map.
7.  The entire output MUST be a single, valid JSON object.
"""
    return _ask_llm(prompt, system)

def generate_flowchart(prompt: str, hints: dict = None) -> dict:
    system = """You are a diagram assistant. Your job is to turn user questions or ideas into a structured flowchart.

Return a JSON object with two keys:
- "nodes": list of labeled steps or decisions
- "edges": list of connections between node IDs, optionally with labels (like "Yes"/"No")

Each node should have:
  - id (string)
  - label (string)  // Renamed from 'text' for consistency with other diagram types
  - type (optional: "default", "input", "output", or "decision")

Each edge should have:
  - id (string)
  - source (string, node id) // Renamed from 'from' for reactflow compatibility
  - target (string, node id) // Renamed from 'to' for reactflow compatibility
  - label (optional)

Example Output:
{
  "nodes": [
    { "id": "1", "label": "Start", "type": "input" },
    { "id": "2", "label": "Input Thought" },
    { "id": "3", "label": "Is the thought complex?", "type": "decision" },
    { "id": "4", "label": "Break into parts" },
    { "id": "5", "label": "Apply LLM to whole thought" },
    { "id": "6", "label": "Apply LLM to parts" },
    { "id": "7", "label": "Combine outputs" },
    { "id": "8", "label": "Output Graph of Thought" },
    { "id": "9", "label": "End", "type": "output" }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" },
    { "id": "e3-4", "source": "3", "target": "4", "label": "Yes" },
    { "id": "e3-5", "source": "3", "target": "5", "label": "No" },
    { "id": "e4-6", "source": "4", "target": "6" },
    { "id": "e5-7", "source": "5", "target": "7" },
    { "id": "e6-7", "source": "6", "target": "7" },
    { "id": "e7-8", "source": "7", "target": "8" },
    { "id": "e8-9", "source": "8", "target": "9" }
  ],
  "layout": { // Keep layout suggestions as before
        "type": "dagre",
        "direction": "TB",
        "spacing": {
            "nodeSeparation": 100,
            "rankSeparation": 120
        }
    }
}

Do not explain anything. Just return valid JSON based on the user's prompt about the diagram they want.
"""
    return _ask_llm(prompt, system)

def generate_concept_map(prompt: str, hints: dict = None) -> dict:
    import json
    cluster_hint = ""
    flow_hint = ""
    anchor_hint = ""
    prune_hint = ""

    if hints:
        if "clusters" in hints:
            cluster_hint = "\nOrganize concepts into these groups:\n" + json.dumps(hints["clusters"], indent=2)
        if "flow_direction" in hints:
            flow_hint = f"\nPrefer a {hints['flow_direction']} layout for visual clarity."
        if "anchor_node" in hints:
            anchor_hint = f'\nTry to use "{hints["anchor_node"]}" as the central concept if appropriate.'
        if "relationship_pruning" in hints and "collapse" in hints["relationship_pruning"]:
            prunes = ", ".join(hints["relationship_pruning"]["collapse"])
            prune_hint = f"\nAvoid using overly generic relationships like: {prunes}."

    system = f"""You are an expert concept map generation engine.
Your primary goal is to create a richly interconnected and meaningful concept map in JSON format.
This map should visually represent relationships between key ideas derived from the user's prompt.

{cluster_hint}{flow_hint}{anchor_hint}{prune_hint}

JSON Structure:
{{
    "concepts": [
        {{ "id": "c1", "label": "Central Concept/Theme", "importance": 1 }},
        ...
    ],
    "relationships": [
        {{ "from": "c1", "to": "c2", "label": "explains" }},
        ...
    ],
    "layout": {{
        "type": "force-directed",
        "spacing": {{
            "idealNodeSpacing": 150,
            "edgeLength": 180
        }},
        "initial": {{
            "radius": 350,
            "center": {{ "x": 500, "y": 400 }}
        }}
    }}
}}

Instructions:
1. Identify and extract main concepts and cluster them where applicable.
2. Create rich relationships (not just one-directional trees).
3. Use linking phrases that are specific and non-redundant.
4. Ensure the result is logical, networked, and well-structured.
5. Output a valid JSON object only.
"""
    return _ask_llm(prompt, system)

def _ask_llm(prompt: str, system_prompt: str) -> dict:
    try:
        # Check if API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OpenAI API key is not set. Please check your .env file.")

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a diagram about: {prompt}"}
            ],
            temperature=0.4,
            max_tokens=1000
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {str(e)}")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}") 