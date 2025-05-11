# Whiteboard AI

A web application that generates interactive diagrams from text prompts using OpenAI's API.

## Features

- Generate mind maps, flowcharts, and concept maps from text prompts
- Interactive diagram visualization with ReactFlow
- Real-time diagram generation using OpenAI's API
- Support for multiple diagram types with automatic classification

## Setup

### Backend Setup

1. Create and activate a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. Start the backend server:
```bash
python main.py
```

The backend will run on http://localhost:8000

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Enter a prompt describing the diagram you want to generate
3. The system will automatically classify the type of diagram needed
4. View and interact with the generated diagram

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── tools.py             # Core diagram generation logic
│   ├── structure_analyzer.py # Prompt analysis and preprocessing
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── DiagramViewer.jsx # Diagram type router
│   │   ├── MindMap.jsx     # Mind map visualization
│   │   ├── Flowchart.jsx   # Flowchart visualization
│   │   ├── ConceptMap.jsx  # Concept map visualization
│   │   └── api.js          # API client
│   └── package.json        # Node.js dependencies
└── README.md
```

## Development

- Backend API documentation is available at http://localhost:8000/docs
- The frontend uses React with Vite for fast development
- ReactFlow is used for diagram visualization
- OpenAI's API is used for diagram generation

## Notes

- Always activate the virtual environment before running the backend
- Keep your OpenAI API key secure and never commit it to version control
- The backend uses FastAPI's automatic API documentation
- The frontend uses ReactFlow for interactive diagram visualization 