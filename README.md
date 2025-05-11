# Whiteboard AI

A real-time diagram generator using OpenAI's API. This application takes a user prompt and converts it into various types of diagrams (mind maps, flowcharts, concept maps) with interactive visualizations.

## Features

- 🤖 AI-powered diagram generation
- 🧠 Multiple diagram types:
  - Mind Maps (with radial layout)
  - Flowcharts
  - Concept Maps
- 🎨 Interactive visualizations with ReactFlow
- 🔄 Real-time updates
- 📱 Responsive design
- 🎯 Automatic prompt classification
- 🎨 Modern Material UI components
- 🔍 Smart layout algorithms

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp .env.example .env
```

5. Add your OpenAI API key to the `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

6. Start the backend server:
```bash
python main.py
```

The backend will run on http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter a prompt describing what you want to visualize, for example:
   - "Create a mind map about project management"
   - "Show me a flowchart of the user registration process"
   - "Make a concept map about artificial intelligence"
3. Click "Generate Diagram" to create the visualization
4. Interact with the diagram:
   - Drag nodes to reposition
   - Zoom in/out with mouse wheel
   - Pan by dragging the background
   - Use the controls in the bottom-right corner

## Diagram Types

### Mind Map
- Hierarchical structure with radial layout
- Root node at center with orbiting branches
- Subitems positioned relative to parent branches
- Animated connections
- Color-coded nodes for better visual hierarchy

### Flowchart
- Sequential flow
- Left-to-right layout
- Animated connections
- Clear start and end points
- Smart edge routing

### Concept Map
- Network of related concepts
- Labeled relationships
- Circular layout
- Bidirectional connections
- Dynamic node positioning

## Development

### Project Structure
```
whiteboard-ai/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── tools.py         # Diagram generation logic
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx      # Main application component
    │   ├── api.js       # API integration
    │   ├── MindMap.jsx  # Mind map visualization
    │   ├── Flowchart.jsx# Flowchart visualization
    │   └── ConceptMap.jsx# Concept map visualization
    └── package.json     # Node.js dependencies
```

### Technologies Used

- Backend:
  - FastAPI
  - OpenAI API
  - Python
  - Pydantic for data validation

- Frontend:
  - React
  - ReactFlow for diagram rendering
  - Dagre for layout algorithms
  - Material UI for components
  - Vite for build tooling
  - ESLint for code quality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 