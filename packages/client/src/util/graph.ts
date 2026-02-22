import _ from 'lodash';
// check https://juejin.cn/post/7579179625461334058
// check https://github.com/dagrejs/dagre/issues/492
import dagre from "@dagrejs/dagre"
import { SkillGraph } from "shared/types/skills"

const nodeW = 240;
const nodeH = 70;

export const layoutSkillGraph = (skillGraph: SkillGraph) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    ranksep: 95,
    marginx: 0,
    marginy: 0
  });
  g.setDefaultEdgeLabel(function() { return {}; });


  // Load in all the nodes
  for (const node of skillGraph.nodes) {
    g.setNode(node.id, {
      label: node.name,
      width: nodeW,
      height: nodeH
    })
  }

  // Load in all the edges 
  for (const node of skillGraph.nodes) {
    if (_.isEmpty(node.prereqs)) {
      continue;
    }

    const upstreamNodeIds = Object.keys(node.prereqs);
    for (const upstreamId of upstreamNodeIds) {
      g.setEdge(upstreamId, node.id);
    }
  }

  // Run algorithm
  dagre.layout(g);
  return g;
}

export const dagreBoundingBox = (g: dagre.graphlib.Graph) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  g.nodes().forEach(nodeId => {
    const node = g.node(nodeId);
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;

    if (left < minX) minX = left;
    if (top < minY) minY = top;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
