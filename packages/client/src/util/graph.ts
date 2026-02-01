import _ from 'lodash';
import dagre from "@dagrejs/dagre"
import { SkillGraph } from "shared/types/skills"

const nodeW = 250;
const nodeH = 80;

export const layoutSkillGraph = (skillGraph: SkillGraph) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    ranksep: 80,
    marginx: 20,
    marginy: 40
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
