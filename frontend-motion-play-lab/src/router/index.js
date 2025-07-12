import { createRouter, createWebHistory } from 'vue-router'
import HomeMotionPlayLab from '../views/HomeMotionPlayLab.vue'
import DinoGestureRush from '../components/DinoGestureRush.vue'
import SerpentMotion from '../components/SerpentMotion.vue'
import SimonGestures from '../components/SimonGestures.vue'

const routes = [
  {
    path: '/',
    name: 'HomeMotionPlayLab',
    component: HomeMotionPlayLab,
  },
  {
    path: '/dino',
    name: 'DinoGestureRush',
    component: DinoGestureRush,
  },
  {
    path: '/serpent',
    name: 'SerpentMotion',
    component: SerpentMotion,
  },
  {
    path: '/simon',
    name: 'SimonGestures',
    component: SimonGestures,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
