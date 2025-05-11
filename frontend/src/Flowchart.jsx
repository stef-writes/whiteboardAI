import ReactFlow, { Background, Controls, Panel, applyNodeChanges } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { useMemo, useState, useEffect } from "react";

const nodeWidth = 180;
const nodeHeight = 50;

function layoutNodesAndEdges(data) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR" }); // LR = Left to Right. Use "TB" for top-down.

  data.nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  data.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to);
  });

  dagre.layout(dagreGraph);

  const nodes = data.nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    return {
      id: node.id,
      position: { x, y },
      data: { label: node.text },
      type: "default",
      draggable: true,
      style: { 
        width: nodeWidth,
        height: nodeHeight,
        background: node.id === '1' ? '#ff6b6b' : '#4ecdc4',
        color: 'white',
        padding: 10,
        borderRadius: 5,
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'move'
      }
    };
  });

  const edges = data.edges.map((edge, i) => ({
    id: `e-${edge.from}-${edge.to}-${i}`,
    source: edge.from,
    target: edge.to,
    type: "smoothstep",
    animated: true,
    style: { 
      stroke: '#95e1d3',
      strokeWidth: 2
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#95e1d3',
    }
  }));

  return { nodes, edges };
}

export default function Flowchart({ data }) {
  const { nodes: initialNodes, edges } = useMemo(() => layoutNodesAndEdges(data), [data]);
  const [nodes, setNodes] = useState(initialNodes);
  useEffect(() => { setNodes(initialNodes); }, [initialNodes]);
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