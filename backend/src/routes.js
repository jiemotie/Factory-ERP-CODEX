import {
  createRole,
  createUser,
  listPermissions,
  listRoles,
  listUsers,
  login,
  logout
} from './modules/identity/service.js';
import {
  approveMaterialInbound,
  confirmMaterialInbound,
  createMaterialInbound,
  getMaterialInbound,
  listMaterialInbounds
} from './modules/material-inbound/service.js';
import { approveOrder, cancelOrder, createOrder, getOrder, listOrders, updateOrder } from './modules/order-entry/service.js';
import {
  completeProcessTask,
  createProcessRoute,
  createProcessTask,
  listProcessRoutes,
  listProcessTasks,
  reworkProcessTask,
  startProcessTask
} from './modules/process-flow/service.js';
import { materialInboundSummary, orderProgress, processCapacity, qualityRate } from './modules/reports/service.js';

export const routes = [
  { method: 'POST', path: '/api/v1/auth/login', handler: login },
  { method: 'POST', path: '/api/v1/auth/logout', handler: logout },
  { method: 'GET', path: '/api/v1/users', handler: listUsers },
  { method: 'POST', path: '/api/v1/users', handler: createUser },
  { method: 'GET', path: '/api/v1/roles', handler: listRoles },
  { method: 'POST', path: '/api/v1/roles', handler: createRole },
  { method: 'GET', path: '/api/v1/permissions', handler: listPermissions },

  { method: 'GET', path: '/api/v1/material-inbounds', handler: listMaterialInbounds },
  { method: 'POST', path: '/api/v1/material-inbounds', handler: createMaterialInbound },
  { method: 'GET', path: '/api/v1/material-inbounds/:id', handler: getMaterialInbound },
  { method: 'POST', path: '/api/v1/material-inbounds/:id/approve', handler: approveMaterialInbound },
  { method: 'POST', path: '/api/v1/material-inbounds/:id/confirm', handler: confirmMaterialInbound },

  { method: 'GET', path: '/api/v1/orders', handler: listOrders },
  { method: 'POST', path: '/api/v1/orders', handler: createOrder },
  { method: 'GET', path: '/api/v1/orders/:id', handler: getOrder },
  { method: 'PATCH', path: '/api/v1/orders/:id', handler: updateOrder },
  { method: 'POST', path: '/api/v1/orders/:id/approve', handler: approveOrder },
  { method: 'POST', path: '/api/v1/orders/:id/cancel', handler: cancelOrder },

  { method: 'GET', path: '/api/v1/process-routes', handler: listProcessRoutes },
  { method: 'POST', path: '/api/v1/process-routes', handler: createProcessRoute },
  { method: 'GET', path: '/api/v1/process-tasks', handler: listProcessTasks },
  { method: 'POST', path: '/api/v1/process-tasks', handler: createProcessTask },
  { method: 'POST', path: '/api/v1/process-tasks/:id/start', handler: startProcessTask },
  { method: 'POST', path: '/api/v1/process-tasks/:id/complete', handler: completeProcessTask },
  { method: 'POST', path: '/api/v1/process-tasks/:id/rework', handler: reworkProcessTask },

  { method: 'GET', path: '/api/v1/reports/material-inbound-summary', handler: materialInboundSummary },
  { method: 'GET', path: '/api/v1/reports/order-progress', handler: orderProgress },
  { method: 'GET', path: '/api/v1/reports/process-capacity', handler: processCapacity },
  { method: 'GET', path: '/api/v1/reports/quality-rate', handler: qualityRate }
];
