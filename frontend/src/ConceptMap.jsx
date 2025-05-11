import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, MarkerType, Panel, applyNodeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

export default function ConceptMap({ data }) {
  const { nodes: initialNodes, edges } = useMemo(() => {
    const newNodes = data.concepts.map((concept, index) => ({
      id: concept.id,
      data: { label: concept.label },
      position: { 
        x: Math.cos(index * (2 * Math.PI / data.concepts.length)) * 300 + 400,
        y: Math.sin(index * (2 * Math.PI / data.concepts.length)) * 300 + 300
      },
      draggable: true,
      style: { 
        width: 180,
        height: 50,
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
    }));
    const newEdges = data.relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.from,
      target: rel.to,
      label: rel.label,
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#95e1d3',
        strokeWidth: 2
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#95e1d3',
      },
      labelStyle: {
        fill: '#666',
        fontSize: '12px',
        fontWeight: 500
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.8
      }
    }));
    return { nodes: newNodes, edges: newEdges };
  }, [data]);
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
            style={{ padding: '8px 16px', background: nodesDraggable ? '#4ecdc4' : '#b2bec3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {nodesDraggable ? '🔒 Lock Nodes' : '🔓 Unlock Nodes'}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
} 