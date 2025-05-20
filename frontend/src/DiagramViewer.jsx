import React, { useState } from "react";
import MindMap from "./MindMap";
import Flowchart from "./Flowchart";
import ConceptMap from "./ConceptMap";

const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return fallback;
  }
  
  return (
    <React.Fragment>
      {React.cloneElement(children, {
        onError: () => setHasError(true)
      })}
    </React.Fragment>
  );
};

export default function DiagramViewer({ diagram }) {
  // Validate the diagram data
  if (!diagram || typeof diagram !== 'object') {
    return (
      <div style={{ color: "red", padding: "1rem", textAlign: "center" }}>
        ⚠️ Invalid diagram data received
      </div>
    );
  }
  
  const { type, data } = diagram;
  
  // Validate that data exists
  if (!data) {
    return (
      <div style={{ color: "red", padding: "1rem", textAlign: "center" }}>
        ⚠️ Missing diagram data
      </div>
    );
  }

  const errorFallback = (
    <div style={{ 
      color: "red", 
      padding: "2rem", 
      textAlign: "center",
      background: "#fff8f8",
      borderRadius: "10px",
      margin: "2rem",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <h3>⚠️ Error rendering diagram</h3>
      <p>There was a problem displaying this diagram type: <strong>{type}</strong></p>
      <p>This might be due to invalid or unexpected data format.</p>
    </div>
  );

  switch (type) {
    case "mindmap":
      return (
        <ErrorBoundary fallback={errorFallback}>
          <MindMap data={data} />
        </ErrorBoundary>
      );
    case "flowchart":
      return (
        <ErrorBoundary fallback={errorFallback}>
          <Flowchart data={data} />
        </ErrorBoundary>
      );
    case "concept_map":
      return (
        <ErrorBoundary fallback={errorFallback}>
          <ConceptMap data={data} />
        </ErrorBoundary>
      );
    default:
      return (
        <div style={{ color: "red", padding: "1rem", textAlign: "center" }}>
          ⚠️ Unknown diagram type: <code>{type}</code>
        </div>
      );
  }
} 