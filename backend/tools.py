import openai
import os
import json
from fastapi import HTTPException
from dotenv import load_dotenv

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
    diagram_type = classify_prompt(prompt)

    generators = {
        "mindmap": generate_mindmap,
        "flowchart": generate_flowchart,
        "concept_map": generate_concept_map
    }

    if diagram_type not in generators:
        raise HTTPException(status_code=400, detail=f"Unknown diagram type: {diagram_type}")

    return {
        "type": diagram_type,
        "data": generators[diagram_type](prompt)
    }

def generate_mindmap(prompt: str) -> dict:
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

def generate_flowchart(prompt: str) -> dict:
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

def generate_concept_map(prompt: str) -> dict:
    system = """You are an expert concept map generation engine.
Your primary goal is to create a richly interconnected and meaningful concept map in JSON format.
This map should visually represent relationships between key ideas derived from the user's prompt.

JSON Structure:
{
    "concepts": [
        {"id": "c1", "label": "Central Concept/Theme", "importance": 1},
        {"id": "c2", "label": "Key Idea A", "importance": 2},
        {"id": "c3", "label": "Key Idea B", "importance": 2},
        {"id": "c4", "label": "Supporting Detail A.1", "importance": 3},
        {"id": "c5", "label": "Related Aspect C", "importance": 2}
    ],
    "relationships": [
        {"from": "c1", "to": "c2", "label": "explains"},
        {"from": "c1", "to": "c3", "label": "is characterized by"},
        {"from": "c2", "to": "c4", "label": "includes example"},
        {"from": "c3", "to": "c5", "label": "influences"},
        {"from": "c2", "to": "c5", "label": "is connected to"} // Example of a cross-link
    ],
    "layout": {
        "type": "force-directed", // Suggests a dynamic, physics-based layout
        "spacing": {
            "idealNodeSpacing": 150, // Ideal distance between nodes
            "edgeLength": 180        // Preferred length for edges
        },
        "initial": { // Optional: hints for initial placement if needed
            "radius": 350,
            "center": {"x": 500, "y": 400}
        }
    }
}

Instructions:
1.  Identify Core Concepts: Extract the main concepts, ideas, and entities from the user's prompt.
    -   One concept should generally serve as a central theme if appropriate for the topic.
    -   "id": Must be a unique string for each concept.
    -   "label": A clear, concise name for the concept.
    -   "importance": (Optional, 1-3 scale, 1=most important) Can help with visual emphasis if the frontend uses it.
2.  Establish Rich Relationships:
    -   This is CRITICAL. Do not just create simple pairs. Aim for a NETWORK structure.
    -   Connect concepts with meaningful, descriptive linking phrases ("label" for the relationship).
    -   Create MULTIPLE connections from and to concepts. Include CROSS-LINKS between different branches of thought.
    -   "from": ID of the source concept.
    -   "to": ID of the target concept.
    -   "label": A verb phrase or prepositional phrase describing how the 'from' concept relates to the 'to' concept (e.g., "leads to", "is part of", "contrasts with").
3.  Network Structure: The map should illustrate a web of knowledge, not just a list or a tree.
4.  Layout: A "force-directed" layout is often good for concept maps. Provide reasonable spacing suggestions.
5.  Depth and Breadth: Generate a reasonable number of concepts (e.g., 5-15) and relationships to adequately cover the topic without being overwhelming.
6.  Clarity and Cohesion: Ensure the map is understandable and the relationships are logical.
7.  The entire output MUST be a single, valid JSON object.
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