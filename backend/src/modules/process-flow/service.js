import { badRequest, created, notFound, ok, requireFields } from '../../http.js';
import { nextId, recordAudit } from '../../store.js';
import { authorize } from '../identity/service.js';

function findTask(store, id) {
  const task = store.processTasks.find((candidate) => candidate.id === id);
  if (!task) {
    notFound('工序任务不存在');
  }
  return task;
}

export function listProcessRoutes({ headers, store }) {
  authorize(headers, store, 'process:write');
  return ok(store.processRoutes);
}

export function createProcessRoute({ body, headers, store }) {
  const actor = authorize(headers, store, 'process:write');
  requireFields(body, ['code', 'name', 'steps']);
  if (!Array.isArray(body.steps) || body.steps.length === 0) {
    badRequest('工艺路线必须包含至少一道工序');
  }

  const route = {
    id: nextId('route', 'processRoute', store),
    code: body.code,
    name: body.name,
    version: body.version ?? 1,
    status: body.status ?? 'active',
    steps: body.steps,
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  };
  store.processRoutes.push(route);
  recordAudit(store, actor, 'create', 'process_route', route.id);
  return created(route);
}

export function listProcessTasks({ headers, store }) {
  authorize(headers, store, 'process:write');
  return ok(store.processTasks);
}

export function createProcessTask({ body, headers, store }) {
  const actor = authorize(headers, store, 'process:write');
  requireFields(body, ['orderId', 'processName']);
  const task = {
    id: nextId('pt', 'processTask', store),
    orderId: body.orderId,
    processName: body.processName,
    status: 'pending',
    assigneeId: body.assigneeId,
    plannedStartAt: body.plannedStartAt,
    plannedEndAt: body.plannedEndAt,
    records: [],
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  };
  store.processTasks.push(task);
  recordAudit(store, actor, 'create', 'process_task', task.id);
  return created(task);
}

export function startProcessTask({ headers, params, store }) {
  const actor = authorize(headers, store, 'process:write');
  const task = findTask(store, params.id);
  if (!['pending', 'rework'].includes(task.status)) {
    badRequest('只有待处理或返工状态的工序任务可以开工');
  }
  task.status = 'in_progress';
  task.startedAt = task.startedAt ?? new Date().toISOString();
  task.records.push({ action: 'start', actorId: actor.id, createdAt: new Date().toISOString() });
  recordAudit(store, actor, 'start', 'process_task', task.id);
  return ok(task);
}

export function completeProcessTask({ body, headers, params, store }) {
  const actor = authorize(headers, store, 'process:write');
  const task = findTask(store, params.id);
  if (task.status !== 'in_progress') {
    badRequest('只有进行中的工序任务可以完工');
  }
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.outputQuantity = body.outputQuantity ?? task.outputQuantity ?? 0;
  task.defectQuantity = body.defectQuantity ?? task.defectQuantity ?? 0;
  task.records.push({
    action: 'complete',
    actorId: actor.id,
    outputQuantity: task.outputQuantity,
    defectQuantity: task.defectQuantity,
    createdAt: new Date().toISOString()
  });
  recordAudit(store, actor, 'complete', 'process_task', task.id);
  return ok(task);
}

export function reworkProcessTask({ body, headers, params, store }) {
  const actor = authorize(headers, store, 'process:write');
  const task = findTask(store, params.id);
  if (task.status !== 'completed') {
    badRequest('只有已完工的工序任务可以返工');
  }
  task.status = 'rework';
  task.reworkReason = body.reason ?? '未填写返工原因';
  task.records.push({ action: 'rework', actorId: actor.id, reason: task.reworkReason, createdAt: new Date().toISOString() });
  recordAudit(store, actor, 'rework', 'process_task', task.id);
  return ok(task);
}
