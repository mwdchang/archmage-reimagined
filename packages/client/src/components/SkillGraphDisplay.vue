<template>
  <div ref="container" class="graph-container">
  </div>
</template>


<script lang="ts" setup>
import * as d3 from 'd3';
import { SkillGraph } from 'shared/types/skills';
import { onMounted, ref, watch } from 'vue';
import { layoutSkillGraph } from '@/util/graph';
import { Mage } from 'shared/types/mage';
import { getSkillById } from 'engine/src/base/references';

const props = defineProps<{
  graph: SkillGraph,
  mage: Mage
}>();

const emit = defineEmits<{
  (e: 'addSkill', skilId: string): void
}>()

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


const getTextList = (label: string | undefined) => {
  const textList: string[] = [];
  if (label) { 
    const tokens = label.split(' ');

    let str = tokens[0];
    for (let i = 1; i < tokens.length; i++) {
      if (str.length > 10) {
        textList.push(str);
        str = tokens[i];
      } else {
        str = str + ` ${tokens[i]}`;
      }
    }
    if (str) {
      textList.push(str);
    }
  } else {
    textList.push('???');
  }

  return textList;
}

const refresh = () => {
  const layout = layoutSkillGraph(props.graph);

  d3.select(container.value).selectAll('*').remove();
  const svg = d3.select(container.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', '0 0 650 900')
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const defs = svg.append('defs');
  const grad = defs.append('radialGradient')
    .attr('id', 'grad')
    .attr('cx', '70%')
    .attr('cy', '70%')
    .attr('4', '50%')
  grad.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#333')
  grad.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#222');

  for (const node of layout.nodes()) {
    const hasSkill = props.mage.skills[node] ? true : false;
    const n = layout.node(node);
    svg.append('rect')
      .attr('x', n.x - 0.5 * n.width)
      .attr('y', n.y - 0.5 * n.height)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('width', n.width)
      .attr('height', n.height)
      .style('stroke', NODE_BORDER)
      .style('stroke-width', 3)
      .style('stroke-dasharray', () => {
        if (hasSkill) {
          return 'none';
        }
        return '6 6';
      })
      // .style('fill', NODE_BACKGROUND)
      .style('fill', 'url(#grad)')
      .on('click', () => {
        emit('addSkill', node);
      });

    // Name
    const textList = getTextList(n.label)
    textList.forEach((text, idx) => {
      svg.append('text')
        .attr('x', n.x - 0.5 * n.width + 0.05 * n.width)
        .attr('y', n.y - 0.5 * n.height + (idx + 1) * 0.33 * n.height)
        .style('font-size', '1.3rem')
        .style('stroke', 'none')
        .style('fill', NODE_TEXT)
        .text(text)
        .style('pointer-events', 'none');
    });

    // Level
    const skill = getSkillById(node);
    svg.append('text')
      .attr('x', n.x - 0.5 * n.width + 0.70 * n.width)
      .attr('y', n.y + 0.25 * n.height) 
      .style('font-size', '1.75rem')
      .style('stroke', 'none')
      .style('fill', NODE_TEXT)
      .text(`${(props.mage.skills[skill!.id] ? props.mage.skills[skill!.id] : 0) }/${skill?.maxLevel}`)
      .style('pointer-events', 'none');
  }

  for (const edge of layout.edges()) {
    const points = layout.edge(edge).points;
    const hasSkill = props.mage.skills[edge.v] ? true : false;

    svg.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', EDGE_BACKGROUND)
      .attr('stroke-width', 5)
      .style('stroke-dasharray', () => {
        if (hasSkill) {
          return 'none';
        }
        return '6 6';
      })
      .style('pointer-events', 'none');
  }
}

watch(
  () => [props.graph, props.mage],
  () => {
    // console.log('hi', props.graph.nodes);
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
}
</style>
