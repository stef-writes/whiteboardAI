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
    # ... use hints in the future if needed ...
    system = """You are an expert flowchart generation engine.
Your goal is to create a clear, logical, and complete flowchart in JSON format.

JSON Structure:
{
    "nodes": [
        {"id": "1", "text": "Start Node", "type": "start"},
        {"id": "2", "text": "Step or Action 1", "type": "process"},
        {"id": "3", "text": "Decision Point?", "type": "decision"},
        {"id": "4", "text": "Step or Action 2A (if yes)", "type": "process"},
        {"id": "5", "text": "Step or Action 2B (if no)", "type": "process"},
        {"id": "6", "text": "End Node", "type": "end"}
    ],
    "edges": [
        {"from": "1", "to": "2", "label": ""},
        {"from": "2", "to": "3", "label": ""},
        {"from": "3", "to": "4", "label": "Yes"},
        {"from": "3", "to": "5", "label": "No"},
        {"from": "4", "to": "6", "label": ""},
        {"from": "5", "to": "6", "label": ""}
    ],
    "layout": {
        "type": "dagre", // For directed graph layout
        "direction": "TB", // TB = Top to Bottom, LR = Left to Right
        "spacing": {
            "nodeSeparation": 100, // Spacing between nodes in the same rank
            "rankSeparation": 120  // Spacing between ranks (layers)
        }
    }
}

Instructions:
1.  Nodes: Define all necessary steps, decisions, and start/end points.
    -   "id": Must be a unique string for each node.
    -   "text": Clear and concise description of the step/decision.
    -   "type": Use appropriate types like "start", "end", "process", "decision". Other types can be "input", "output" if relevant.
2.  Edges: Connect the nodes to represent the flow.
    -   "from": ID of the source node.
    -   "to": ID of the target node.
    -   "label": Use for decision outcomes (e.g., "Yes", "No", "True", "False") or brief transition descriptions.
3.  Flow: The flowchart must have a clear start and at least one end point. All nodes should be part of a sequence.
4.  Logic: Ensure decision points have distinct paths for different outcomes.
5.  Layout: Suggest "TB" (Top to Bottom) or "LR" (Left to Right) for direction. Adjust spacing for readability.
6.  Completeness: The flowchart should represent a complete process as implied by the user's prompt.
7.  The entire output MUST be a single, valid JSON object.
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
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a diagram about: {prompt}"}
            ],
            temperature=0.4,
            max_tokens=1000
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}") 