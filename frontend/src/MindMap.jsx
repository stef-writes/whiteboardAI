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
      width: 140,
      height: 40,
      background: '#ff6b6b',
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
  });

  const branches = Object.entries(data.branches);
  const angleStep = (2 * Math.PI) / branches.length;

  branches.forEach(([branch, items], i) => {
    const angle = i * angleStep;
    const branchX = center.x + radius * Math.cos(angle);
    const branchY = center.y + radius * Math.sin(angle);
    const branchId = `branch-${i}`;

    nodes.push({
      id: branchId,
      position: { x: branchX, y: branchY },
      data: { label: branch },
      draggable: true,
      style: { 
        width: 140,
        height: 40,
        background: '#4ecdc4',
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
    });

    edges.push({ 
      id: `e-root-${branchId}`,
      source: "root",
      target: branchId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#95e1d3', strokeWidth: 2 }
    });

    items.forEach((item, j) => {
      const subId = `${branchId}-item-${j}`;
      const offset = spacing.subitem;
      const subX = branchX + offset * Math.cos(angle);
      const subY = branchY + offset * Math.sin(angle);

      nodes.push({
        id: subId,
        position: { x: subX, y: subY },
        data: { label: item },
        draggable: true,
        style: { 
          width: 140,
          height: 40,
          background: '#95e1d3',
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
      });

      edges.push({ 
        id: `e-${branchId}-${subId}`,
        source: branchId,
        target: subId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#95e1d3', strokeWidth: 2 }
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
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={nodesDraggable}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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