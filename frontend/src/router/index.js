import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/',
    name: 'catalog',
    component: () => import('../views/CatalogView.vue'),
  },
  {
    path: '/producto/:slug',
    name: 'product',
    component: () => import('../views/ProductDetailView.vue'),
    props: true,
  },
  {
    path: '/comparar',
    name: 'compare',
    component: () => import('../views/CompareView.vue'),
  },
  {
    path: '/carrito',
    name: 'cart',
    component: () => import('../views/CartView.vue'),
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/recibo/:ventaId',
    name: 'receipt',
    component: () => import('../views/ReceiptView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/seguimiento/:codigo?',
    name: 'tracking',
    component: () => import('../views/TrackingView.vue'),
    props: true,
  },
  {
    path: '/tracking/:codigo?',
    name: 'tracking-alias',
    component: () => import('../views/TrackingView.vue'),
    props: true,
  },
  {
    path: '/soporte',
    name: 'support',
    component: () => import('../views/SupportView.vue'),
  },
  {
    path: '/ayuda',
    name: 'help',
    component: () => import('../views/SupportView.vue'),
  },
  {
    path: '/reclamos',
    name: 'claims',
    component: () => import('../views/SupportView.vue'),
  },
  {
    path: '/mis-pedidos',
    name: 'orders',
    component: () => import('../views/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/cuenta/pedidos',
    name: 'account-orders',
    component: () => import('../views/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/direcciones',
    name: 'addresses',
    component: () => import('../views/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/registro',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/empresa/login',
    name: 'company-login',
    component: () => import('../views/CompanyLoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresStaff: true },
    children: [
      {
        path: '',
        name: 'admin',
        redirect: { name: 'admin-resumen' },
      },
      {
        path: 'resumen',
        name: 'admin-resumen',
        component: () => import('../views/admin/AdminResumenView.vue'),
      },
      {
        path: 'productos',
        name: 'admin-productos',
        component: () => import('../views/admin/AdminProductosView.vue'),
        meta: { allowedFunctions: ['vendedor', 'admin'] },
      },
      {
        path: 'pedidos',
        name: 'admin-pedidos',
        component: () => import('../views/admin/AdminPedidosView.vue'),
        meta: { allowedFunctions: ['operaciones', 'empleado', 'admin'] },
      },
      {
        path: 'inventario',
        name: 'admin-inventario',
        component: () => import('../views/admin/AdminInventarioView.vue'),
        meta: { allowedFunctions: ['operaciones', 'empleado', 'admin'] },
      },
      {
        path: 'soporte',
        name: 'admin-soporte',
        component: () => import('../views/admin/AdminSoporteView.vue'),
        meta: { allowedFunctions: ['soporte', 'admin'] },
      },
      {
        path: 'personal',
        name: 'admin-personal',
        component: () => import('../views/admin/AdminPersonalView.vue'),
        meta: { requireAdmin: true },
      },
      {
        path: 'auditoria',
        name: 'admin-auditoria',
        component: () => import('../views/admin/AdminAuditoriaView.vue'),
        meta: { requireAdmin: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  // REQ-EMP-10: Si el usuario es empleado o admin e intenta ir a rutas de consumo de cliente
  // (/carrito, /checkout, /comparar, / o catalogo), redirigir de inmediato al portal corporativo /admin
  const retailClientRoutes = ['catalog', 'cart', 'checkout', 'compare', 'product'];
  if (auth.isAuthenticated && auth.isStaff) {
    if (retailClientRoutes.includes(to.name) || to.path === '/') {
      return { name: 'admin' };
    }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresStaff && !auth.isStaff) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // REQ-ADM-13: Protección estricta de subpáginas por rol/función activa
  if (to.meta.requireAdmin && !auth.isAdmin && auth.user?.rol !== 'admin') {
    return { name: 'admin-resumen' };
  }

  if (to.meta.allowedFunctions) {
    const fn = auth.funcionActiva || auth.user?.rol;
    if (!to.meta.allowedFunctions.includes(fn) && !auth.isAdmin && auth.user?.rol !== 'admin') {
      return { name: 'admin-resumen' };
    }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return auth.isStaff ? { name: 'admin' } : { name: 'catalog' };
  }
  return true;
});

export default router;
