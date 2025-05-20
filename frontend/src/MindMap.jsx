import ReactFlow, { Background, Controls, Panel, applyNodeChanges } from "reactflow";
import "reactflow/dist/style.css";
import { useMemo, useState, useEffect } from "react";

function layoutMindMap(data) {
  const nodes = [];
  const edges = [];
  const layout = data.layout || {
    type: "radial",
    radius: 200,
    center: { x: 400, y: 300 },
    spacing: { branch: 80, subitem: 60 }
  };

  const { center, radius, spacing } = layout;

  // Add root node at center
  nodes.push({
    id: "root",
    position: { x: center.x, y: center.y },
    data: { label: data.root },
    draggable: true,
    style: { 
      width: Math.max(180, data.root.length * 8), // Dynamic width based on text length
      height: 60,
      background: '#ff6b6b',
      color: 'white',
      padding: '10px 15px',
      borderRadius: 30, // Circular for root node
      fontSize: '16px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
      cursor: 'move',
      textAlign: 'center',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  });

  const branches = Object.entries(data.branches);
  const angleStep = (2 * Math.PI) / branches.length;

  branches.forEach(([branch, items], i) => {
    const angle = i * angleStep;
    const branchX = center.x + radius * Math.cos(angle);
    const branchY = center.y + radius * Math.sin(angle);
    const branchId = `branch-${i}`;
    
    // Dynamic width based on text length
    const branchWidth = Math.max(160, branch.length * 9);

    nodes.push({
      id: branchId,
      position: { x: branchX - branchWidth/2, y: branchY - 25 }, // Adjust position for centered node
      data: { label: branch },
      draggable: true,
      style: { 
        width: branchWidth,
        height: 50,
        background: '#4ecdc4',
        color: 'white',
        padding: '10px 15px',
        borderRadius: 10, // Rounded rectangle
        fontSize: '15px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
        cursor: 'move',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        border: '2px solid #3db4ac'
      }
    });

    edges.push({ 
      id: `e-root-${branchId}`,
      source: "root",
      target: branchId,
      type: 'default', // Changed to default for smoother bezier curve
      style: { 
        stroke: '#95e1d3', 
        strokeWidth: 2,
        borderRadius: 20
      },
      animated: false,
      markerEnd: {
        type: 'arrow',
        width: 15,
        height: 15,
        color: '#95e1d3',
      }
    });

    items.forEach((item, j) => {
      const subId = `${branchId}-item-${j}`;
      
      // Adjust angle slightly to avoid crowding
      const subAngle = angle + (j - Math.floor(items.length/2)) * (angleStep * 0.15);
      const offset = spacing.subitem;
      const subX = branchX + offset * Math.cos(subAngle);
      const subY = branchY + offset * Math.sin(subAngle);
      
      // Dynamic width for sub-items too
      const itemWidth = Math.max(140, item.length * 7);

      nodes.push({
        id: subId,
        position: { x: subX - itemWidth/2, y: subY - 20 }, // Adjust for centering
        data: { label: item },
        draggable: true,
        style: { 
          width: itemWidth,
          height: 40,
          background: '#ffffff',
          color: '#555555',
          padding: '8px 12px',
          borderRadius: 20, // Pill shape
          fontSize: '14px',
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'move',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          border: '1px solid #95e1d3'
        }
      });

      edges.push({ 
        id: `e-${branchId}-${subId}`,
        source: branchId,
        target: subId,
        type: 'default', // Changed to default for smoother bezier curve
        animated: false,
        style: { 
          stroke: '#95e1d3', 
          strokeWidth: 1.5 
        }
      });
    });
  });

  return { nodes, edges };
}

export default function MindMap({ data }) {
  const { nodes: initialNodes, edges } = useMemo(() => layoutMindMap(data), [data]);
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
        fitViewOptions={{ padding: 0.3 }} // Increased padding
        nodesDraggable={nodesDraggable}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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