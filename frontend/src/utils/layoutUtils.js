import dagre from 'dagre';

const nodeWidth = 180;
const nodeHeight = 60;

export function layoutNodesWithDagre(
  nodes, 
  edges, 
  direction = 'TB'
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.style?.width || nodeWidth, 
      height: node.style?.height || nodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const positionedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x, y },
      // For React Flow, source/target positions are often best handled by the node type or style
      // If you have custom nodes that need specific handle positions based on layout, adjust here
      // sourcePosition: direction === 'LR' ? 'right' : 'bottom',
      // targetPosition: direction === 'LR' ? 'left' : 'top',
    };
  });

  // Return a new array for edges to ensure React Flow detects changes if edge properties were modified.
  const positionedEdges = edges.map(edge => ({ ...edge }));

  return { nodes: positionedNodes, edges: positionedEdges };
} 