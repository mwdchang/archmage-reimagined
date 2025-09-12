<template>
  <section class="row">
    <img src="@/assets/images/ascendant-new.png" style="width: 64px"/>
    <img src="@/assets/images/verdant-new.png" style="width: 64px"/>
    <img src="@/assets/images/eradication-new.png" style="width: 64px"/>
    <img src="@/assets/images/nether-new.png" style="width: 64px"/>
    <img src="@/assets/images/phantasm-new.png" style="width: 64px"/>
    <img src="@/assets/images/exiled-new.png" style="width: 64px"/>
  </section>
  <section style="padding: 0 3rem">
    <div class="markdown-body" v-html="guide" />
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import guideStr from '@/assets/docs/guide.md?raw';
import { marked } from 'marked';

const guide = ref("");

onMounted(async () => {
  console.log('in guide view...........', guide);
  guide.value = await marked(guideStr); 
})
</script>

<style scoped>;
.markdown-body {
  font-size: 110%;
  line-height: 120%;
}

::v-deep(.markdown-body h4),
::v-deep(.markdown-body h3),
::v-deep(.markdown-body h2) {
  margin-top: 20px;
  color: #f80;
}

::v-deep(.markdown-body pre) {
  padding: 8px;
  margin: 8px;
  background: #333;
}
</style>
