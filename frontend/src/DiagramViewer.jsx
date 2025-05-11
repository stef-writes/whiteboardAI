import MindMap from "./MindMap";
import Flowchart from "./Flowchart";
import ConceptMap from "./ConceptMap";

export default function DiagramViewer({ diagram }) {
  const { type, data } = diagram;

  switch (type) {
    case "mindmap":
      return <MindMap data={data} />;
    case "flowchart":
      return <Flowchart data={data} />;
    case "concept_map":
      return <ConceptMap data={data} />;
    default:
      return (
        <div style={{ color: "red", padding: "1rem" }}>
          ⚠️ Unknown diagram type: <code>{type}</code>
        </div>
      );
  }
} 