<template>
  <main class="flex flex-col justify-center gap-[5px] items-center">
    <section class="row">
      <img src="@/assets/images/ascendant-new.png" class="w-[64px]"/>
      <img src="@/assets/images/verdant-new.png" class="w-[64px]"/>
      <img src="@/assets/images/eradication-new.png" class="w-[64px]"/>
      <img src="@/assets/images/nether-new.png" class="w-[64px]"/>
      <img src="@/assets/images/phantasm-new.png" class="w-[64px]"/>
      <img src="@/assets/images/exiled-new.png" class="w-[64px]"/>
    </section>

    <section class="row items-baseline w-[50rem]">
      <div class="w-[8rem]">
        <div class="cursor-pointer leading-[150%] hover:text-[#f80]" :class="{ 'text-[#f80] font-semibold': key === 'quickstart' }" @click="openMarkdown('quickstart')">Quick Start</div>
        <div class="cursor-pointer leading-[150%] hover:text-[#f80]" :class="{ 'text-[#f80] font-semibold': key === 'kingdom' }" @click="openMarkdown('kingdom')">Kingdom</div>
        <div class="cursor-pointer leading-[150%] hover:text-[#f80]" :class="{ 'text-[#f80] font-semibold': key === 'battle' }" @click="openMarkdown('battle')">Battle</div>
        <div class="cursor-pointer leading-[150%] hover:text-[#f80]" :class="{ 'text-[#f80] font-semibold': key === 'skills' }" @click="openMarkdown('skills')">Skills</div>
      </div>
      <div class="markdown-body ml-4 flex-1 min-h-[10rem]" v-html="guide" />
    </section>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
// import guideStr from '@/assets/docs/guide.md?raw';
import { marked } from 'marked';


const pages: Record<string, string> = import.meta.glob('@/assets/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

const key = ref('');
const guide = ref('');

const openMarkdown = async (filename: string) => {
  key.value = filename;
  const path = `/src/assets/docs/${filename}.md`;
  const content = pages[path];
  console.log(content);
  guide.value = await marked(content);
}

onMounted(async () => {
  // guide.value = await marked(guideStr); 
  openMarkdown('quickstart');
})
</script>

<style scoped>
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
</style>
