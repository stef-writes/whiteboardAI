import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_concepts_and_structure(prompt: str) -> dict:
    system_prompt = """
You are a layout assistant for AI diagrams.
Based on the user's prompt, return layout preferences to improve visual clarity.

Return JSON like:
{
  "flow_direction": "top-down" or "left-to-right",
  "anchor_node": "central concept or key item"
}

Only respond with JSON.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=100
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"flow_direction": "top-down"}  # Fallback 