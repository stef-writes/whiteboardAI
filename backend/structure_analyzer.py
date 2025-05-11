import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_concepts_and_structure(prompt: str) -> dict:
    system_prompt = """
You are a structural visualization analyst.
Given a prompt for a diagram, return the following as JSON:
{
  "clusters": {
    "Group Name": ["Node1", "Node2", ...]
  },
  "flow_direction": "left-to-right" or "top-down",
  "relationship_pruning": {
    "collapse": ["redundant_label1", ...]
  },
  "anchor_node": "suggested central or most connected concept"
}
Respond only with valid JSON.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Prompt: {prompt}"}
            ],
            temperature=0.3,
            max_tokens=500
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {}  # Fallback: return empty structure hints 