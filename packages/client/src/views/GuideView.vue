<template>
  <main class="column" style="align-items: center">
    <section class="row">
      <img src="@/assets/images/ascendant-new.png" style="width: 64px"/>
      <img src="@/assets/images/verdant-new.png" style="width: 64px"/>
      <img src="@/assets/images/eradication-new.png" style="width: 64px"/>
      <img src="@/assets/images/nether-new.png" style="width: 64px"/>
      <img src="@/assets/images/phantasm-new.png" style="width: 64px"/>
      <img src="@/assets/images/exiled-new.png" style="width: 64px"/>
    </section>

    <section class="row" style="align-items: baseline; width: 50rem">
      <div style="width: 8rem">
        <div class="doc-nav" @click="openMarkdown('quickstart')">Quick Start</div>
        <div class="doc-nav" @click="openMarkdown('battle')">Battle</div>
      </div>
      <div class="markdown-body" style="margin-left: 1rem; flex: 1; min-height: 10rem" v-html="guide" />
    </section>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
// import guideStr from '@/assets/docs/guide.md?raw';
import { marked } from 'marked';


const pages = import.meta.glob('@/assets/docs/*.md', {
  as: 'raw',
  eager: true
})

const guide = ref("");

const openMarkdown = async (filename: string) => {
  const key = `/src/assets/docs/${filename}.md`;
  const content = pages[key];
  console.log(content);
  guide.value = await marked(content);
}

onMounted(async () => {
  // guide.value = await marked(guideStr); 
  openMarkdown('quickstart');
})
</script>

<style scoped>;
.markdown-body {
  font-size: 100%;
  line-height: 125%;
}

::v-deep(.markdown-body h4),
::v-deep(.markdown-body h3),
::v-deep(.markdown-body h2) {
  color: #f80;
  margin-bottom: 0.5rem;
}

::v-deep(.markdown-body pre) {
  padding: 8px;
  margin: 8px;
  background: #333;
}

::v-deep(.markdown-body p) {
  margin-bottom: 0.5rem;
}

::v-deep(.markdown-body code) {
  background: #444;
  padding: 0px 3px;
  font-size: 90%;
  border-radius: 2px;
}

.doc-nav {
  cursor: pointer;
  line-height: 150%;
}

.doc-nav:hover {
  color: #f80;
}


</style>
