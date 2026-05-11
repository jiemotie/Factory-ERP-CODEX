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

export function generateOrderProcessTasks({ body, headers, params, store }) {
  const actor = authorize(headers, store, 'order:write');
  const order = findOrder(store, params.id);
  if (order.status !== 'approved') {
    badRequest('只有已审核订单可以生成工序任务');
  }
  if (Array.isArray(order.processTaskIds) && order.processTaskIds.length > 0) {
    badRequest('订单已生成工序任务，不能重复生成');
  }

  const processNames = body.processNames ?? ['下料', '加工', '质检'];
  if (!Array.isArray(processNames) || processNames.length === 0) {
    badRequest('工序名称列表不能为空');
  }

  const createdAt = new Date().toISOString();
  const tasks = processNames.map((processName, index) => {
    const task = {
      id: nextId('pt', 'processTask', store),
      orderId: order.id,
      orderNo: order.orderNo,
      processName,
      sequence: index + 1,
      status: 'pending',
      assigneeId: body.assigneeId,
      plannedStartAt: body.plannedStartAt,
      plannedEndAt: body.plannedEndAt,
      records: [],
      source: 'order_generation',
      createdAt,
      createdBy: actor.id
    };
    store.processTasks.push(task);
    recordAudit(store, actor, 'create', 'process_task', task.id, { orderId: order.id, orderNo: order.orderNo });
    return task;
  });

  order.processTaskIds = tasks.map((task) => task.id);
  order.processTasksGeneratedAt = createdAt;
  order.updatedAt = createdAt;
  order.updatedBy = actor.id;
  recordAudit(store, actor, 'generate_process_tasks', 'order', order.id, { processTaskIds: order.processTaskIds });
  return created({ order, tasks });
}
