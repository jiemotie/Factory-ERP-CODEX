import { ok } from '../../http.js';
import { authorize } from '../identity/service.js';
import { buildInventoryBalances } from '../material-inbound/service.js';

function sum(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) ?? 0), 0);
}

export function materialInboundSummary({ headers, store }) {
  authorize(headers, store, 'report:read');
  return ok({
    totalInboundOrders: store.materialInbounds.length,
    confirmedInboundOrders: store.materialInbounds.filter((inbound) => inbound.status === 'confirmed').length,
    totalInboundQuantity: sum(store.inventoryTransactions.filter((transaction) => transaction.direction === 'in'), (transaction) => transaction.quantity)
  });
}

export function orderProgress({ headers, store }) {
  authorize(headers, store, 'report:read');
  const byStatus = store.orders.reduce((result, order) => {
    result[order.status] = (result[order.status] ?? 0) + 1;
    return result;
  }, {});
  return ok({ totalOrders: store.orders.length, byStatus });
}

export function processCapacity({ headers, store }) {
  authorize(headers, store, 'report:read');
  return ok({
    totalTasks: store.processTasks.length,
    completedTasks: store.processTasks.filter((task) => task.status === 'completed').length,
    outputQuantity: sum(store.processTasks, (task) => task.outputQuantity),
    defectQuantity: sum(store.processTasks, (task) => task.defectQuantity)
  });
}

export function qualityRate({ headers, store }) {
  authorize(headers, store, 'report:read');
  const outputQuantity = sum(store.processTasks, (task) => task.outputQuantity);
  const defectQuantity = sum(store.processTasks, (task) => task.defectQuantity);
  const goodQuantity = Math.max(outputQuantity - defectQuantity, 0);
  return ok({
    outputQuantity,
    defectQuantity,
    goodQuantity,
    qualityRate: outputQuantity === 0 ? 0 : Number((goodQuantity / outputQuantity).toFixed(4))
  });
}

export function inventoryBalance({ headers, store }) {
  authorize(headers, store, 'report:read');
  const balances = buildInventoryBalances(store.inventoryTransactions);
  return ok({
    totalMaterials: balances.length,
    totalQuantity: sum(balances, (balance) => balance.quantity),
    balances
  });
}
