import { badRequest, created, notFound, ok, requireFields } from '../../http.js';
import { nextId, recordAudit } from '../../store.js';
import { authorize } from '../identity/service.js';

function findInbound(store, id) {
  const inbound = store.materialInbounds.find((candidate) => candidate.id === id);
  if (!inbound) {
    notFound('材料入库单不存在');
  }
  return inbound;
}

export function listMaterialInbounds({ headers, store }) {
  authorize(headers, store, 'material:write');
  return ok(store.materialInbounds);
}

export function createMaterialInbound({ body, headers, store }) {
  const actor = authorize(headers, store, 'material:write');
  requireFields(body, ['supplierName', 'items']);
  if (!Array.isArray(body.items) || body.items.length === 0) {
    badRequest('材料明细不能为空');
  }

  const inbound = {
    id: nextId('mi', 'materialInbound', store),
    inboundNo: body.inboundNo ?? `MI-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${store.counters.materialInbound}`,
    supplierName: body.supplierName,
    status: 'draft',
    inboundDate: body.inboundDate ?? new Date().toISOString().slice(0, 10),
    items: body.items,
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  };
  store.materialInbounds.push(inbound);
  recordAudit(store, actor, 'create', 'material_inbound', inbound.id);
  return created(inbound);
}

export function getMaterialInbound({ headers, params, store }) {
  authorize(headers, store, 'material:write');
  return ok(findInbound(store, params.id));
}

export function approveMaterialInbound({ headers, params, store }) {
  const actor = authorize(headers, store, 'material:write');
  const inbound = findInbound(store, params.id);
  if (inbound.status !== 'draft') {
    badRequest('只有草稿状态的材料入库单可以审核');
  }
  inbound.status = 'approved';
  inbound.approvedAt = new Date().toISOString();
  inbound.approvedBy = actor.id;
  recordAudit(store, actor, 'approve', 'material_inbound', inbound.id);
  return ok(inbound);
}

export function confirmMaterialInbound({ headers, params, store }) {
  const actor = authorize(headers, store, 'material:write');
  const inbound = findInbound(store, params.id);
  if (inbound.status !== 'approved') {
    badRequest('只有已审核的材料入库单可以确认入库');
  }
  inbound.status = 'confirmed';
  inbound.confirmedAt = new Date().toISOString();
  inbound.confirmedBy = actor.id;
  const transactions = inbound.items.map((item) => ({
    id: nextId('itx', 'inventoryTransaction', store),
    sourceType: 'material_inbound',
    sourceId: inbound.id,
    materialCode: item.materialCode,
    materialName: item.materialName,
    batchNo: item.batchNo,
    quantity: item.quantity,
    unit: item.unit,
    direction: 'in',
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  }));
  store.inventoryTransactions.push(...transactions);
  recordAudit(store, actor, 'confirm', 'material_inbound', inbound.id, { transactionIds: transactions.map((item) => item.id) });
  return ok({ inbound, transactions });
}

export function listInventoryTransactions({ headers, store }) {
  authorize(headers, store, 'material:write');
  return ok(store.inventoryTransactions);
}
