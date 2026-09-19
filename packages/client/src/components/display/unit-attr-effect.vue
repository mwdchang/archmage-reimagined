<template>
  <template v-for="(attr) of attributes" :key="attr.key">
    <div v-if="attr.rule === 'set'">
      Set {{ displayKey(attr.key) }} to:
    </div>
    <div v-else-if="attr.rule === 'remove'">
      Remove {{ displayKey(attr.key) }}:
    </div>
    <div v-else class="effect-desc">
      Modify <span class="f600">{{ displayKey(attr.key) }}</span> by &nbsp;
      <span class="special-text">{{ ruleFormula(attr.rule) }}</span>
    </div>
    <ul class="flex flex-col">
      <li
        v-for="(val, magic) of attr.magic"
        :key="magic"
        class="magic-value-row">
        <magic :magic="magic" small />
        <span>{{ formatValue(val as any) }}</span>
      </li>
    </ul>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { UnitAttrEffect } from 'shared/src/effects';
import Magic from '@/components/magic.vue';
import { readableNumber, readableStr } from '@/util/util';

const props = defineProps<{
  effect: UnitAttrEffect
}>();

const attributes = computed(() => {
  return Object.entries(props.effect.attributes).map(([key, attr]) => {
    return {
      key,
      rule: attr.rule,
      magic: attr.magic
    };
  });
});

const displayKey = (key: string) =>
  key.split(",").map(readableStr).join(", ");

const ruleFormula = (rule: string) => {
  switch (rule) {
    case 'add': return 'value';
    case 'addPercentageBase': return 'value * base';
    case 'addSpellLevel': return 'spell power * value';
    case 'addSpellLevelPercentage': return 'spell power / max spell power * value';
    case 'addSpellLevelPercentageBase': return 'spell power / max spell power * value * attribute';
    default: return '';
  }
};

const formatExtra = (extra: unknown): string => {
  if (extra === null || extra === undefined) return '';
  if (typeof extra === 'number') return readableNumber(extra);
  if (typeof extra === 'string') return readableStr(extra);
  if (Array.isArray(extra)) return extra.map(formatExtra).join(', ');
  if (typeof extra === 'object') {
    return Object.entries(extra as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${readableStr(k)}${v === true ? '' : `: ${formatExtra(v)}`}`)
      .join(', ');
  }
  return String(extra);
};

const formatValue = (val: Record<string, unknown>): string => {
  const value = val.value;
  const extra = val.extra;
  if (typeof value === 'number') return readableNumber(value);
  if (typeof value === 'string') {
    const s = readableStr(value);
    return extra == null ? s : `${s} (${formatExtra(extra)})`;
  }
  if (value && typeof value === 'object') {
    const { name, extra: nestedExtra } = value as { name?: string; extra?: unknown };
    const nameStr = name ? readableStr(name) : '';
    const ext = nestedExtra ?? extra;
    return ext == null ? nameStr : `${nameStr} (${formatExtra(ext)})`;
  }
  return String(value ?? '');
};
</script>
