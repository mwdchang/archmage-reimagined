<template>
  <div ref="container" class="graph-container">
  </div>
</template>


<script lang="ts" setup>
import * as d3 from 'd3';
import { Skill, SkillGraph } from 'shared/types/skills';
import { onMounted, ref, watch } from 'vue';
import { layoutSkillGraph } from '@/util/graph';

const props = defineProps<{
  graph: SkillGraph,
  skills: Skill[]
}>();


const container = ref(null);

type Point = {
  x: number;
  y: number;
};
const line = d3.line<Point>()
  .x(d => d.x)
  .y(d => d.y)
  .curve(d3.curveBasis);

const NODE_BORDER = '#838383';
const NODE_BACKGROUND = '#232323';
const NODE_TEXT = '#eeeeee';
const EDGE_BACKGROUND = '#3355BA';

const refresh = () => {
  const layout = layoutSkillGraph(props.graph);

  d3.select(container.value).selectAll('*').remove();
  const svg = d3.select(container.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', '0 0 650 900')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  for (const node of layout.nodes()) {
    const n = layout.node(node);
    svg.append('rect')
      .attr('x', n.x - 0.5 * n.width)
      .attr('y', n.y - 0.5 * n.height)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('width', n.width)
      .attr('height', n.height)
      .style('stroke', NODE_BORDER)
      .style('stroke-width', 2)
      .style('fill', NODE_BACKGROUND);

    svg.append('text')
      .attr('x', n.x - 0.5 * n.width + 0.05 * n.width)
      .attr('y', n.y - 0.5 * n.height + 0.38 * n.height)
      .style('font-size', '1.3rem')
      .style('stroke', 'none')
      .style('fill', NODE_TEXT)
      .text(n.label || '???');
  }

  for (const edge of layout.edges()) {
    const points = layout.edge(edge).points;
    svg.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', EDGE_BACKGROUND)
      .attr('stroke-width', 5);
  }
}

watch(
  () => props.graph,
  () => {
    console.log('hi', props.graph.nodes);
    refresh();
  }
)

onMounted(() => {
  if (!container.value) {
    return;
  }
  refresh();
});
</script>

<style scoped>
.graph-container {
  width: 38rem;
  height: 45rem;
  border: 1px solid #555555;
  border-radius: 1rem;
}
</style>
