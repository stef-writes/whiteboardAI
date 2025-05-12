import ReactFlow, { Background, Controls, Panel, applyNodeChanges } from "reactflow";
import "reactflow/dist/style.css";
import { useMemo, useState, useEffect } from "react";
import { layoutNodesWithDagre } from "./utils/layoutUtils"; // Corrected import path

// Default node style, can be overridden by individual node styles from backend data
const defaultNodeStyle = {
  width: 180,
  height: 60,
  fontSize: '14px',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  cursor: 'move',
  padding: 10,
  borderRadius: 5,
};

export default function Flowchart({ data }) { // data here is expected to be { nodes: [], edges: [], layout: {direction: 'TB' | 'LR'} }
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Ensure data.nodes and data.edges exist before trying to layout
    if (!data || !data.nodes || !data.edges) {
      return { nodes: [], edges: [] };
    }

    // Prepare nodes for dagre: ensure they have an id and label for dagre and React Flow
    // The backend should already provide 'label' (previously 'text')
    const reactFlowNodes = data.nodes.map(node => ({
      id: node.id,
      data: { label: node.label }, // Use 'label' from backend
      type: node.type || "default",
      draggable: true,
      style: {
        ...defaultNodeStyle,
        background: node.type === 'input' || node.type === 'start' ? '#ff6b6b' : 
                    node.type === 'output' || node.type === 'end' ? '#7edc67' : '#4ecdc4',
        color: 'white',
        ...(node.style || {}), // Allow backend to provide specific styles
      },
    }));

    // Edges are mostly fine, just ensure IDs are unique for React Flow if not already
    const reactFlowEdges = data.edges.map((edge, i) => ({
      id: edge.id || `e-${edge.source}-${edge.target}-${i}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: "smoothstep",
      animated: true,
      style: { stroke: '#95e1d3', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#95e1d3' },
    }));

    const layoutDirection = data.layout?.direction || 'TB'; // Default to Top-Bottom
    return layoutNodesWithDagre(reactFlowNodes, reactFlowEdges, layoutDirection);

  }, [data]);

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges); // Edges are generally static after layout

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges); 
  }, [initialNodes, initialEdges]);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };
  
  // We might need onEdgesChange if edges are also dynamic, but for now, they are static after layout
  // const onEdgesChange = (changes) => {
  //   setEdges((eds) => applyEdgeChanges(changes, eds));
  // };

  const [nodesDraggable, setNodesDraggable] = useState(true);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange} // Uncomment if edges become dynamic
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={nodesDraggable}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
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