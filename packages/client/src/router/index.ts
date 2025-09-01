import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import InteriorView from '@/views/InteriorView.vue'; // TODO: deprecated
import ExploreView from '@/views/ExploreView.vue';
import GeldView from '@/views/GeldView.vue';
import AboutView from '@/views/AboutView.vue';
import BuildingView from '@/views/BuildingView.vue';
import DestroyView from '@/views/DestroyView.vue';
import StatusReportView from '@/views/StatusReportView.vue';
import RankListView from '@/views/RankListView.vue';
import SpellView from '@/views/SpellView.vue';
import DispelView from '@/views/DispelView.vue';
import TestView from '@/views/TestView.vue';
import MageView from '@/views/MageView.vue';
import BattleView from '@/views/BattleView.vue';
import BattlePrepView from '@/views/BattlePrepView.vue';
import ResearchView from '@/views/ResearchView.vue';
import ItemView from '@/views/ItemView.vue';
import BattleResultView from '@/views/BattleResultView.vue';
import ChroniclesView from '@/views/ChroniclesView.vue';
import AssignmentView from '@/views/AssignmentView.vue';
import RecruitView from '@/views/RecruitView.vue';
import DisbandView from '@/views/DisbandView.vue';
import DisplayUnitView from '@/views/DisplayUnitView.vue';
import DisplaySpellView from '@/views/DisplaySpellView.vue';
import DisplayItemView from '@/views/DisplayItemView.vue';
import DefeatedView from '@/views/DefeatedView.vue';

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
      path: '/defeated',
      name: 'defeated',
      component: DefeatedView
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
      path: '/explore',
      name: 'explore',
      component: ExploreView
    },
    {
      path: '/geld',
      name: 'geld',
      component: GeldView
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
      path: '/dispel',
      name: 'dispel',
      component: DispelView
    },
    {
      path: '/item',
      name: 'item',
      component: ItemView 
    },
    {
      path: '/assignment',
      name: 'assignment',
      component: AssignmentView 
    },
    {
      path: '/recruit',
      name: 'recruit',
      component: RecruitView
    },
    {
      path: '/disband',
      name: 'disband',
      component: DisbandView
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
    },
    {
      path: '/battle-prep/:targetId',
      name: 'battlePrep',
      component: BattlePrepView,
      props: true
    },
    {
      path: '/research',
      name: 'research',
      component: ResearchView 
    },
    {
      path: '/battle-result/:id',
      name: 'battleResult',
      component: BattleResultView,
      props: true
    },
    {
      path: '/chronicles',
      name: 'chronicles',
      component: ChroniclesView
    },
    // Misc
    {
      path: '/view-unit/:id',
      name: 'viewUnit',
      component: DisplayUnitView,
      props: true
    },
    {
      path: '/view-spell/:id',
      name: 'viewSpell',
      component: DisplaySpellView,
      props: true
    },
    {
      path: '/view-item/:id',
      name: 'viewItem',
      component: DisplayItemView,
      props: true
    }
  ]
})

export default router
