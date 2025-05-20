import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, MarkerType, Panel, applyNodeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

// Function to create better layout using dagre
function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 120, nodesep: 100 });

  // Add nodes to dagre with their dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.style.width, height: node.style.height });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(dagreGraph);

  // Apply the layout positions to our nodes
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - node.style.width / 2,
          y: nodeWithPosition.y - node.style.height / 2,
        }
      };
    }),
    edges,
  };
}

// Get node style based on importance or type, with special handling for philosophy mode
function getNodeStyle(concept, index, total, isPhilosophyMode = false) {
  // Use concept.importance if available, otherwise generate based on index
  const importance = concept.importance || (total - index) / total;
  
  // In philosophy mode, we have different styling based on epistemic status and type
  if (isPhilosophyMode) {
    const type = concept.type || '';
    const epistemicStatus = concept.epistemic_status || '';
    
    // Calculate text width based on length and potential modal operators
    const fontSize = 14;
    const textWidth = Math.max(200, concept.label.length * fontSize * 0.7);
    
    // Calculate size based on type
    const sizeScale = 
      type.includes('axiom') ? 1.2 :
      type.includes('theorem') ? 1.0 :
      0.9;
    
    const width = textWidth * sizeScale;
    const height = 60 * sizeScale;
    
    // Colors for different philosophical concept types
    const bgColor = 
      type.includes('axiom') ? '#4a4e69' :  // Dark purple for axioms
      type.includes('theorem') ? '#8a5a44' : // Brown for theorems
      type.includes('boundary') ? '#457b9d' : // Blue for boundary conditions
      '#2b2d42';  // Dark slate for others
    
    const borderColor = 
      epistemicStatus.includes('defined') ? '#f8961e' :  // Orange for defined concepts
      epistemicStatus.includes('assumed') ? '#f94144' :  // Red for assumed concepts
      epistemicStatus.includes('derived') ? '#90be6d' :  // Green for derived concepts
      '#f1faee';  // White for others
    
    return {
      width,
      height,
      background: bgColor,
      color: 'white',
      padding: 10,
      borderRadius: 8,
      fontSize: `${fontSize}px`,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px rgba(0,0,0,0.25)',
      cursor: 'move',
      border: `3px solid ${borderColor}`,
      textAlign: 'center',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    };
  }
  
  // Standard styling for regular concept maps
  const sizeScale = 0.7 + (importance * 0.5); // Scale between 0.7 and 1.2
  
  // Calculate text width
  const fontSize = 14;
  const textWidth = Math.max(180, concept.label.length * fontSize * 0.6);
  
  const width = textWidth * sizeScale;
  const height = 50 * sizeScale;
  
  // Default style with sizing
  return {
    width,
    height,
    background: concept.type === 'action' ? '#ffd166' : // Yellow for actions
               concept.type === 'state' ? '#06d6a0' :  // Teal for states
               importance > 0.7 ? '#ef476f' :          // Red for important concepts
               importance > 0.4 ? '#118ab2' :          // Blue for medium concepts
               '#073b4c',                              // Dark blue for minor concepts
    color: 'white',
    padding: 10,
    borderRadius: concept.type === 'action' ? 8 : 25,  // Rounded for concepts, pill for actions
    fontSize: `${fontSize}px`,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
    cursor: 'move',
    border: '2px solid white',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };
}

// Get edge style enhanced for philosophy mode
function getEdgeStyle(relationship, isPhilosophyMode = false) {
  if (isPhilosophyMode) {
    const relationLabel = relationship.label || relationship.relation || '';
    const strength = relationship.strength || 0.7;
    const argumentForm = relationship.argument_form || '';
    
    // Colors for different relation types
    const edgeColor = 
      relationLabel.includes('requires') ? '#457b9d' :
      relationLabel.includes('contradicts') ? '#e63946' :
      relationLabel.includes('entails') ? '#a8dadc' :
      relationLabel.includes('presupposes') ? '#f8961e' :
      '#95e1d3';  // Default color
    
    // Line style based on argument form
    const edgeStyle = {
      stroke: edgeColor,
      strokeWidth: Math.max(1, strength * 3),
    };
    
    if (argumentForm.includes('deductive')) {
      edgeStyle.strokeDasharray = '0'; // Solid line for deductive
    } else if (argumentForm.includes('abductive')) {
      edgeStyle.strokeDasharray = '5,5'; // Dashed for abductive
    } else if (argumentForm.includes('analogical')) {
      edgeStyle.strokeDasharray = '1,5'; // Dotted for analogical
    }
    
    return edgeStyle;
  }
  
  // Standard edge style for regular concept maps
  return { 
    stroke: '#95e1d3',
    strokeWidth: relationship.strength ? Math.max(1, relationship.strength * 3) : 2,
  };
}

export default function ConceptMap({ data, onError }) {
  // Check if we're in philosophy mode
  const isPhilosophyMode = data?.metadata?.mode === 'philosophy' || 
                          data?.mode === 'philosophy' ||
                          Boolean(data?.metadata?.axiomatic_basis);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    try {
      if (!data) {
        console.warn("No data provided to ConceptMap component");
        return { nodes: [], edges: [] };
      }
      
      if (!data.concepts || !Array.isArray(data.concepts) || data.concepts.length === 0) {
        console.warn("ConceptMap data is missing concepts array or it's empty");
        return { nodes: [], edges: [] };
      }
      
      if (!data.relationships || !Array.isArray(data.relationships)) {
        console.warn("ConceptMap data is missing relationships array");
        data.relationships = []; // Provide empty relationships array to avoid errors
      }
      
      // Create nodes with better styling
      const totalConcepts = data.concepts.length;
      const newNodes = data.concepts.map((concept, index) => {
        // Get the node label - handle special formatting for philosophy mode
        let nodeLabel = typeof concept.label === 'string' ? concept.label : `Concept ${index}`;
        
        // For philosophy mode, we might want to show additional info in the label
        if (isPhilosophyMode && concept.definition) {
          // Truncate definition if too long
          const shortDef = concept.definition.length > 60 
            ? concept.definition.substring(0, 60) + '...' 
            : concept.definition;
            
          nodeLabel = (
            <div>
              <div style={{ fontWeight: 'bold' }}>{nodeLabel}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>{shortDef}</div>
            </div>
          );
        }
        
        return {
          id: concept.id || `concept-${index}`, // Ensure ID exists
          data: { label: nodeLabel }, 
          draggable: true,
          style: getNodeStyle(concept, index, totalConcepts, isPhilosophyMode)
        };
      });

      // Create better looking edges with proper styling
      const newEdges = data.relationships.map((rel, index) => {
        // Ensure source and target exist
        if (!rel.from || !rel.to) {
          console.warn(`Relationship ${index} is missing source or target`);
          return null; // This will be filtered out below
        }
        
        return {
          id: `edge-${index}`,
          source: rel.from,
          target: rel.to,
          label: rel.label || '',
          type: 'default', // Smoother curves
          animated: false,
          style: getEdgeStyle(rel, isPhilosophyMode),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isPhilosophyMode && rel.relation === 'contradicts' ? '#e63946' : '#95e1d3',
            width: 15,
            height: 15
          },
          labelStyle: {
            fill: '#666',
            fontSize: '12px',
            fontWeight: 500
          },
          labelBgStyle: {
            fill: 'white',
            fillOpacity: 0.9,
            rx: 4,
            ry: 4,
            padding: 10
          },
          labelBgPadding: [8, 4],
        };
      }).filter(Boolean); // Filter out any null values

      // Get a better layout using dagre
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes, 
        newEdges,
        data.layout?.direction || 'LR'
      );
      
      return { nodes: layoutedNodes, edges: layoutedEdges };
    } catch (error) {
      console.error("Error in ConceptMap component:", error);
      return { nodes: [], edges: [] };
    }
  }, [data, isPhilosophyMode]);
  
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  
  useEffect(() => { 
    setNodes(initialNodes); 
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);
  
  const [nodesDraggable, setNodesDraggable] = useState(true);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={nodesDraggable}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background 
          color={isPhilosophyMode ? "#2b2d42" : "#f0f0f0"} 
          gap={20} 
          variant={isPhilosophyMode ? "dots" : "lines"}
          size={isPhilosophyMode ? 1 : 0.5}
        />
        <Controls />
        <Panel position="top-right" style={{ 
          background: 'white', 
          padding: '10px', 
          borderRadius: '5px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => setNodesDraggable(!nodesDraggable)}
            style={{ 
              padding: '8px 16px', 
              background: nodesDraggable ? '#4ecdc4' : '#b2bec3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            {nodesDraggable ? '🔒 Lock Nodes' : '🔓 Unlock Nodes'}
          </button>
          
          {isPhilosophyMode && data?.metadata?.axiomatic_basis && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              background: '#f8f9fa', 
              padding: '5px', 
              borderRadius: '4px' 
            }}>
              <div style={{ fontWeight: 'bold' }}>Axiomatic Basis:</div>
              {data.metadata.axiomatic_basis.join(', ')}
            </div>
          )}
          
          {isPhilosophyMode && data?.metadata?.paradoxes_detected && 
           data.metadata.paradoxes_detected.length > 0 && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              background: '#ffccd5', 
              padding: '5px', 
              borderRadius: '4px' 
            }}>
              <div style={{ fontWeight: 'bold' }}>Paradoxes:</div>
              {data.metadata.paradoxes_detected.join(', ')}
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
} 