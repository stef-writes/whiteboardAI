import openai
import os
import json
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Check if API key is set
if not os.getenv("OPENAI_API_KEY"):
    logger.error("OpenAI API key is not set in .env file")
    raise ValueError("OpenAI API key is not set. Please check your .env file.")

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
        logger.info(f"Analyzing structure for prompt: {prompt}")
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Prompt: {prompt}"}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        try:
            result = json.loads(response.choices[0].message.content)
            logger.info(f"Structure analysis result: {result}")
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse structure analysis response as JSON: {str(e)}")
            return {}  # Fallback: return empty structure hints
            
    except Exception as e:
        logger.error(f"Error in structure analysis: {str(e)}", exc_info=True)
        return {}  # Fallback: return empty structure hints 