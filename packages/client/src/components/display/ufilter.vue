<template>
  <span v-for="(val, key, idx) of filter">
    <span v-if="idx > 0" style="color: #f80">&nbsp;and&nbsp;</span>

    <!-- magic -->
    <span v-if="key === 'magic'">
      Magic = {{ (val as string[]).join(' or ') }}
    </span>

    <!-- race -->
    <span v-if="key === 'race'">
      Race = {{ (val as string[]).join(' or ') }}
    </span>

    <!-- abilities -->
    <span v-if="key === 'abilities'">
      Ability = {{ (val as string[]).join(' or ') }}
    </span>

    <!-- attacks -->
    <span v-if="key === 'allAttackType'">
      Any attack type = {{ (val as string[]).join(' or ') }}
    </span>
    <span v-if="key === 'primaryAttackType'">
      Primary attack type = {{ (val as string[]).join(' or ') }}
    </span>
    <span v-if="key === 'secondaryAttackType'">
      Secondary attack type = {{ (val as string[]).join(' or ') }}
    </span>

  </span>
</template>

<script lang="ts" setup>
import { UnitFilter } from 'shared/types/unit';

defineProps<{
  filter: UnitFilter 
}>();
</script>

