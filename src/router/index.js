import { createRouter, createWebHistory } from 'vue-router'

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),

const routes = [
  {
    path: '/',
    name: 'EApprovalMain',
    component: () => import('@/views/EApprovalMain.vue'),
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/Test.vue'),
  },
  {
    path: '/editor',
    name: 'Editor',
    component: () => import('@/components/editor/quill/QuillEditorSample2.vue'),
  },
  {
    path: '/tipTap',
    name: 'tipTap',
    component: () => import('@/views/TipTapTest.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
