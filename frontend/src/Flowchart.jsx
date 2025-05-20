import ReactFlow, { Background, Controls, Panel, applyNodeChanges } from "reactflow";
import "reactflow/dist/style.css";
import { useMemo, useState, useEffect } from "react";
import { layoutNodesWithDagre } from "./utils/layoutUtils";

// Define distinct node styles based on type
const getNodeStyle = (nodeType) => {
  // Base style all nodes share
  const baseStyle = {
    padding: 10,
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
    cursor: 'move',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    border: '2px solid',
  };
  
  // Type-specific styles
  switch(nodeType) {
    case 'input':
    case 'start':
      return {
        ...baseStyle,
        background: '#ff6b6b', 
        color: 'white',
        borderRadius: 25, // Rounded shape for start nodes
        height: 50,
        borderColor: '#e95959',
      };
    case 'output':
    case 'end':
      return {
        ...baseStyle,
        background: '#7edc67',
        color: 'white',
        borderRadius: 25, // Rounded for end nodes
        height: 50,
        borderColor: '#6abe5a',
      };
    case 'decision':
      return {
        ...baseStyle,
        background: '#feca57',
        color: '#333',
        borderRadius: 4, // Diamond-like shape for decisions
        height: 60,
        transform: 'rotate(45deg)', // Diamond shape
        borderColor: '#e0b54e',
      };
    default:
      return {
        ...baseStyle,
        background: '#4ecdc4',
        color: 'white',
        borderRadius: 8, // Rounded rectangle for process nodes
        height: 50,
        borderColor: '#3db4ac',
      };
  }
};

export default function Flowchart({ data }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Comprehensive error handling
    try {
      if (!data) {
        console.warn("No data provided to Flowchart component");
        return { nodes: [], edges: [] };
      }
      
      if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        console.warn("Flowchart data is missing nodes array or it's empty");
        return { nodes: [], edges: [] };
      }
      
      if (!data.edges || !Array.isArray(data.edges)) {
        console.warn("Flowchart data is missing edges array");
        data.edges = []; // Provide empty edges array to avoid errors
      }

      // Process nodes with better styling
      const reactFlowNodes = data.nodes.map(node => {
        // Get dynamic width based on label length
        const labelText = typeof node.label === 'string' ? node.label : 'Unknown';
        const labelLength = labelText.length || 10;
        const minWidth = 150;  
        const calculatedWidth = Math.max(minWidth, labelLength * 9);
        
        // Get style based on node type
        const nodeStyle = getNodeStyle(node.type);
        
        // For decision nodes, we need to handle the label specially
        const isDecision = node.type === 'decision';
        
        return {
          id: node.id || `node-${Math.random().toString(36).substring(2, 9)}`, // Ensure node has ID
          data: { 
            label: isDecision ? 
              // If it's a decision node, wrap the label in a div that counteracts the rotation
              <div style={{ transform: 'rotate(-45deg)', width: '100%', maxWidth: '100%' }}>
                {labelText}
              </div> : 
              labelText 
          },
          type: node.type || "default",
          draggable: true,
          style: {
            width: calculatedWidth,
            ...nodeStyle,
            ...(node.style || {}), // Allow backend to provide specific styles
          },
        };
      });

      // Improve edge styling
      const reactFlowEdges = data.edges.map((edge, i) => ({
        id: edge.id || `e-${edge.source}-${edge.target}-${i}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep", // Better for flowcharts
        animated: false, // Animation can be distracting in complex flows
        style: { 
          stroke: '#95e1d3', 
          strokeWidth: 2
        },
        markerEnd: { 
          type: 'arrowclosed', 
          color: '#95e1d3',
          width: 15,
          height: 15
        },
        labelStyle: { 
          fill: '#555', 
          fontSize: 12,
          fontWeight: 500
        },
        labelBgStyle: { 
          fill: 'white', 
          fillOpacity: 0.8,
          rx: 4, // Rounded rectangle for label background 
          ry: 4
        },
      }));

      const layoutDirection = data.layout?.direction || 'TB';
      return layoutNodesWithDagre(reactFlowNodes, reactFlowEdges, layoutDirection);
    } catch (error) {
      console.error("Error in useMemo callback:", error);
      return { nodes: [], edges: [] };
    }
  }, [data]);

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges); 
  }, [initialNodes, initialEdges]);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const [nodesDraggable, setNodesDraggable] = useState(true);

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
        </Panel>
      </ReactFlow>
    </div>
  );
} 