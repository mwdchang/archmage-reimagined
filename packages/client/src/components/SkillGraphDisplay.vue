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
import { readableStr } from '@/util/util';

const props = defineProps<{
  graph: SkillGraph,
  mage: Mage
}>();

const emit = defineEmits<{
  (e: 'addSkill', skilId: string): void;
  (e: 'viewSkill', skilId: string): void;
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

const NODE_BORDER = '#B3B3B3';
const NODE_BACKGROUND = '#232323';
const NODE_TEXT = '#eeeeee';
const NODE_TEXT_DARK = '#CCCCCC';
// const EDGE_BACKGROUND = '#3355BA';
const EDGE_BACKGROUND = NODE_BORDER;
const DASH = '6 8';

const getTextList = (label: string | undefined) => {
  const textList: string[] = [];
  if (label) { 
    const tokens = label.split(' ');

    let str = '';
    for (let i = 0; i < tokens.length; i++) {
      if (str.length + tokens[i].length > 10 && str !== '') {
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


function applyGlowFilter(svg: d3.Selection<SVGSVGElement, any, any, any>, id: string, color: string) {
  // ensure <defs> exists
  let defs = svg.select<SVGDefsElement>("defs");
  if (defs.empty()) {
    defs = svg.append("defs");
  }

  // avoid duplicate filter
  if (!defs.select(`#${id}`).empty()) {
    return id;
  }

  const filter = defs.append("filter")
    .attr("id", id)
    .attr("filterUnits", "userSpaceOnUse")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

  filter.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 9)
    .attr("result", "blur");

  filter.append("feFlood")
    .attr("flood-color", color)
    .attr("flood-opacity", 1)
    .attr("result", "color");

  filter.append("feComposite")
    .attr("in", "color")
    .attr("in2", "blur")
    .attr("operator", "in")
    .attr("result", "glow");

  const merge = filter.append("feMerge");
  merge.append("feMergeNode").attr("in", "glow");
  merge.append("feMergeNode").attr("in", "SourceGraphic");

  return id;
}

const refresh = () => {
  const layout = layoutSkillGraph(props.graph);

  d3.select(container.value).selectAll('*').remove();
  const svg = d3.select(container.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${36 * 20} ${38 * 20}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');


  const colourRef = Object.freeze({
    ascendant: '#dddddd',
    verdant: '#22ee22',
    eradication: '#ee2222',
    nether: '#888888',
    phantasm: '#22aaee'
  });

  applyGlowFilter(svg, 'ascendant', colourRef.ascendant);
  applyGlowFilter(svg, 'verdant', colourRef.verdant);
  applyGlowFilter(svg, 'eradication', colourRef.eradication);
  applyGlowFilter(svg, 'nether', colourRef.nether);
  applyGlowFilter(svg, 'phantasm', colourRef.phantasm);

  for (const edge of layout.edges()) {
    const points = layout.edge(edge).points;
    const hasSkill = props.mage.skills[edge.v] ? true : false;

    const targetSkill = getSkillById(edge.w);
    const targetRerequiredLevel = targetSkill?.prereqs[edge.v] || 0;

    let unlocked = false;
    if (props.mage.skills[edge.v] && props.mage.skills[edge.v] >= targetRerequiredLevel) {
      unlocked = true;
    }

    const path = svg.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      // .attr('stroke', EDGE_BACKGROUND)
      .attr('stroke', () => {
        return colourRef[props.graph.id]
      })
      .attr('stroke-width', 5)
      .style('stroke-dasharray', () => {
        if (unlocked === true) {
          return 'none';
        }
        return '4 4';
      })
      //.style('pointer-events', 'none');
      .style('filter', () => {
        if (hasSkill) {
          return `url(#${props.graph.id})`
        }
        return null;
      });


    if (unlocked === false) {
      const len = path.node()?.getTotalLength() || 0;
      const midpoint = path.node()?.getPointAtLength(len / 2);
      svg.append('text')
        .attr('x', midpoint!.x)
        .attr('y', midpoint!.y)
        .style('stroke', 'none')
        .style('fill', NODE_TEXT_DARK)
        .style('text-anchor', 'middle')
        .style('font-size', '1.25rem')
        // .text(`${targetRerequiredLevel} ${readableStr(edge.v)} to unlock`);
        .text(`${targetRerequiredLevel} to unlock`);
    }
  }

  const mage = props.mage!;
  for (const node of layout.nodes()) {
    const hasSkill = props.mage.skills[node] ? true : false;
    const n = layout.node(node);
    const group = svg.append('g');

    group.append('rect')
      .attr('x', n.x - 0.5 * n.width)
      .attr('y', n.y - 0.5 * n.height)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('width', n.width)
      .attr('height', n.height)
      .style('stroke', colourRef[props.graph.id])
      .style('stroke-width', 2)
      .style('stroke-dasharray', () => {
        if (hasSkill) {
          return 'none';
        }
        return '4 4';
      })
      .style('fill', NODE_BACKGROUND)
      .style('filter', () => {
        if (hasSkill) {
          return `url(#${props.graph.id})`
        }
        return null;
      });

    // Name
    const textList = getTextList(n.label)
    const anchorRect = group.append('rect')
      .attr('x', n.x - 0.5 * n.width + 0.05 * n.width)
      .attr('y', n.y - 0.5 * n.height)
      .attr('width', 100)
      .attr('height', 60)
      .attr('fill', 'transparent');

    anchorRect.on('mouseenter', () => {
      group.selectAll('.anchor-text').style('fill', '#2be');
    });
    anchorRect.on('mouseout', () => {
      group.selectAll('.anchor-text').style('fill', NODE_TEXT);
    });
    anchorRect.on('click', () => {
      emit('viewSkill', node);
    })

    textList.forEach((text, idx) => {
      group.append('text')
        .classed('anchor-text', true)
        .attr('x', n.x - 0.5 * n.width + 0.05 * n.width)
        .attr('y', n.y - 0.5 * n.height + (idx + 1) * 0.38 * n.height)
        .style('font-size', '1.50rem')
        .style('stroke', 'none')
        .style('fill', NODE_TEXT)
        .text(text)
        .style('pointer-events', 'none');
    });


    group.append('rect')
      .attr('x', n.x + 0.18 * n.width)
      .attr('y', n.y - 0.5 * n.height + 2) 
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', 75)
      .attr('height', n.height - 4)
      .attr('fill', '#258')
      .on('mouseenter', function() {
        d3.select(this).attr('fill', '#28B')
      })
      .on('mouseleave', function() {
        d3.select(this).attr('fill', '#258')
      })
      .on('click', () => {
        emit('addSkill', node);
      });

    group.append('line')
      .attr('x1', n.x + 0.18 * n.width)
      .attr('y1', n.y - 0.5 * n.height) 
      .attr('x2', n.x + 0.18 * n.width)
      .attr('y2', n.y + 0.5 * n.height)
      .attr('stroke', NODE_BORDER)
      .style('stroke-width', 3)
      .style('stroke-dasharray', () => {
        if (hasSkill) {
          return 'none';
        }
        return '4 4';
      });


    // Level
    const skill = getSkillById(node);
    if (!mage.skills[skill!.id]) {
      group.append('text')
        .attr('x', n.x + 80)
        .attr('y', n.y + 20) 
        .style('font-size', '5.25rem')
        .style('stroke', 'none')
        .style('fill', NODE_TEXT)
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .text('+');

      continue;
    }

    group.append('text')
      .attr('x', n.x + 80)
      .attr('y', n.y + 0.10 * n.height) 
      .style('font-size', '2.0rem')
      .style('stroke', 'none')
      .style('fill', NODE_TEXT)
      .style('text-anchor', 'middle')
      .text(`${(mage.skills[skill!.id] ? mage.skills[skill!.id] : 0) }/${skill?.maxLevel}`)
      .style('pointer-events', 'none');

  }
}

watch(
  () => [props.graph, props.mage],
  () => {
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
  width: 36rem;
  height: 38rem;
  background: radial-gradient(circle at 50% 70%, #0b3d91 0%, #061a40 70%, #000000 100%);
  border: 1px solid #333;
}
</style>
