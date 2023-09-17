import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import InteriorView from '@/views/InteriorView.vue';
import AboutView from '@/views/AboutView.vue';
import BuildingView from '@/views/BuildingView.vue';
import DestroyView from '@/views/DestroyView.vue';
import StatusReportView from '@/views/StatusReportView.vue';
import RankListView from '@/views/RankListView.vue';
import SpellView from '@/views/SpellView.vue';
import TestView from '@/views/TestView.vue';
import MageView from '@/views/MageView.vue';
import BattleView from '@/views/BattleView.vue';

const router = createRouter({
  //@ts-ignore
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      // component: () => import('../views/AboutView.vue')
    },
    {
      path: '/interior',
      name: 'interor',
      component: InteriorView
    },
    {
      path: '/build',
      name: 'build',
      component: BuildingView
    },
    {
      path: '/destroy',
      name: 'destroy',
      component: DestroyView
    },
    {
      path: '/status',
      name: 'status',
      component: StatusReportView 
    },
    {
      path: '/rankList',
      name: 'rankList',
      component: RankListView
    },
    {
      path: '/spell',
      name: 'spell',
      component: SpellView
    },
    {
      path: '/test',
      name: 'test',
      component: TestView
    },
    {
      path: '/mage/:mageId',
      name: 'mage',
      component: MageView,
      props: true
    },
    {
      path: '/battle',
      name: 'battle',
      component: BattleView
    }
  ]
})

export default router
