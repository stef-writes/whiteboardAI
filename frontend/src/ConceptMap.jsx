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

// Get node style based on importance or type
function getNodeStyle(concept, index, total) {
  // Use concept.importance if available, otherwise generate based on index
  const importance = concept.importance || (total - index) / total;
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

export default function ConceptMap({ data, onError }) {
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
      const newNodes = data.concepts.map((concept, index) => ({
        id: concept.id || `concept-${index}`, // Ensure ID exists
        data: { label: typeof concept.label === 'string' ? concept.label : `Concept ${index}` }, // Ensure label exists
        draggable: true,
        style: getNodeStyle(concept, index, totalConcepts)
      }));

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
          style: { 
            stroke: '#95e1d3',
            strokeWidth: rel.strength ? Math.max(1, rel.strength * 3) : 2, // Variable width based on strength
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#95e1d3',
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
  }, [data]);
  
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
        <Background color="#f0f0f0" gap={20} />
        <Controls />
        <Panel position="top-right" style={{ background: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setNodesDraggable(!nodesDraggable)}
            style={{ padding: '8px 16px', background: nodesDraggable ? '#4ecdc4' : '#b2bec3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {nodesDraggable ? '🔒 Lock Nodes' : '🔓 Unlock Nodes'}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
} 