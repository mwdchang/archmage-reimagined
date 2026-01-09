declare module '*.svg' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

/* Image hack */
declare module '*.png' {
  const src: string
  export default src
}
