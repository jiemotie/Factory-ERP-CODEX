import { badRequest, created, notFound, ok, requireFields } from '../../http.js';
import { nextId, recordAudit } from '../../store.js';
import { authorize } from '../identity/service.js';

function findOrder(store, id) {
  const order = store.orders.find((candidate) => candidate.id === id);
  if (!order) {
    notFound('订单不存在');
  }
  return order;
}

export function listOrders({ headers, store }) {
  authorize(headers, store, 'order:write');
  return ok(store.orders);
}

export function createOrder({ body, headers, store }) {
  const actor = authorize(headers, store, 'order:write');
  requireFields(body, ['customerName', 'items']);
  if (!Array.isArray(body.items) || body.items.length === 0) {
    badRequest('订单明细不能为空');
  }

  const order = {
    id: nextId('ord', 'order', store),
    orderNo: body.orderNo ?? `ORD-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${store.counters.order}`,
    customerName: body.customerName,
    status: 'draft',
    dueDate: body.dueDate,
    remark: body.remark,
    items: body.items,
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  };
  store.orders.push(order);
  recordAudit(store, actor, 'create', 'order', order.id);
  return created(order);
}

export function getOrder({ headers, params, store }) {
  authorize(headers, store, 'order:write');
  return ok(findOrder(store, params.id));
}

export function updateOrder({ body, headers, params, store }) {
  const actor = authorize(headers, store, 'order:write');
  const order = findOrder(store, params.id);
  if (!['draft', 'approved'].includes(order.status)) {
    badRequest('当前订单状态不允许更新');
  }
  Object.assign(order, {
    customerName: body.customerName ?? order.customerName,
    dueDate: body.dueDate ?? order.dueDate,
    remark: body.remark ?? order.remark,
    items: body.items ?? order.items,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.id
  });
  recordAudit(store, actor, 'update', 'order', order.id);
  return ok(order);
}

export function approveOrder({ headers, params, store }) {
  const actor = authorize(headers, store, 'order:write');
  const order = findOrder(store, params.id);
  if (order.status !== 'draft') {
    badRequest('只有草稿状态的订单可以审核');
  }
  order.status = 'approved';
  order.approvedAt = new Date().toISOString();
  order.approvedBy = actor.id;
  recordAudit(store, actor, 'approve', 'order', order.id);
  return ok(order);
}

export function cancelOrder({ headers, params, store }) {
  const actor = authorize(headers, store, 'order:write');
  const order = findOrder(store, params.id);
  if (order.status === 'cancelled') {
    badRequest('订单已经取消');
  }
  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.cancelledBy = actor.id;
  recordAudit(store, actor, 'cancel', 'order', order.id);
  return ok(order);
}
