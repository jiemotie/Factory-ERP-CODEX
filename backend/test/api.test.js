import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/server.js';
import { createStore } from '../src/store.js';
import { createPersistentStore, saveStore } from '../src/persistence.js';

let server;
let baseUrl;
let token;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    },
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;
  return { response, payload };
}

describe('Factory ERP backend API', () => {
  before(async () => {
    server = createApp(createStore());
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it('authenticates the seeded administrator and lists permissions', async () => {
    const login = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });

    assert.equal(login.response.status, 200);
    assert.ok(login.payload.data.token);
    token = login.payload.data.token;

    const permissions = await request('/api/v1/permissions');
    assert.equal(permissions.response.status, 200);
    assert.ok(permissions.payload.data.some((permission) => permission.code === 'report:read'));
  });

  it('creates, approves, and confirms a material inbound order with inventory transactions', async () => {
    const created = await request('/api/v1/material-inbounds', {
      method: 'POST',
      body: {
        supplierName: '华东钢材',
        items: [{ materialCode: 'STEEL-001', materialName: '冷轧钢板', batchNo: 'B20260511', quantity: 120, unit: 'kg' }]
      }
    });

    assert.equal(created.response.status, 201);
    const inboundId = created.payload.data.id;

    const approved = await request(`/api/v1/material-inbounds/${inboundId}/approve`, { method: 'POST' });
    assert.equal(approved.payload.data.status, 'approved');

    const confirmed = await request(`/api/v1/material-inbounds/${inboundId}/confirm`, { method: 'POST' });
    assert.equal(confirmed.payload.data.inbound.status, 'confirmed');
    assert.equal(confirmed.payload.data.transactions[0].quantity, 120);

    const transactions = await request('/api/v1/inventory-transactions');
    assert.equal(transactions.response.status, 200);
    assert.equal(transactions.payload.data.length, 1);
  });

  it('rejects invalid material inbound state transitions', async () => {
    const created = await request('/api/v1/material-inbounds', {
      method: 'POST',
      body: {
        supplierName: '状态测试供应商',
        items: [{ materialCode: 'COPPER-001', materialName: '铜线', batchNo: 'B20260512', quantity: 20, unit: 'kg' }]
      }
    });

    const confirmed = await request(`/api/v1/material-inbounds/${created.payload.data.id}/confirm`, { method: 'POST' });
    assert.equal(confirmed.response.status, 400);
    assert.equal(confirmed.payload.error.message, '只有已审核的材料入库单可以确认入库');
  });

  it('records an order and reports order progress', async () => {
    const created = await request('/api/v1/orders', {
      method: 'POST',
      body: {
        customerName: '示例客户',
        dueDate: '2026-06-01',
        items: [{ productCode: 'P-001', productName: '样品零件', quantity: 10, unit: 'pcs' }]
      }
    });

    assert.equal(created.response.status, 201);
    const orderId = created.payload.data.id;

    const approved = await request(`/api/v1/orders/${orderId}/approve`, { method: 'POST' });
    assert.equal(approved.payload.data.status, 'approved');

    const report = await request('/api/v1/reports/order-progress');
    assert.equal(report.response.status, 200);
    assert.equal(report.payload.data.byStatus.approved, 1);
  });

  it('tracks process task flow and computes quality rate', async () => {
    const created = await request('/api/v1/process-tasks', {
      method: 'POST',
      body: { orderId: 'ord-0001', processName: '冲压' }
    });

    assert.equal(created.response.status, 201);
    const taskId = created.payload.data.id;

    const started = await request(`/api/v1/process-tasks/${taskId}/start`, { method: 'POST' });
    assert.equal(started.payload.data.status, 'in_progress');

    const completed = await request(`/api/v1/process-tasks/${taskId}/complete`, {
      method: 'POST',
      body: { outputQuantity: 100, defectQuantity: 3 }
    });
    assert.equal(completed.payload.data.status, 'completed');

    const report = await request('/api/v1/reports/quality-rate');
    assert.equal(report.payload.data.qualityRate, 0.97);
  });
});


describe('Factory ERP persistence', () => {
  let directory;

  after(async () => {
    if (directory) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('persists business data to a JSON data file', async () => {
    directory = await mkdtemp(join(tmpdir(), 'factory-erp-'));
    const dataFile = join(directory, 'data.json');
    const firstStore = await createPersistentStore(dataFile);
    firstStore.orders.push({ id: 'ord-test', orderNo: 'ORD-TEST', customerName: '持久化客户', status: 'draft', items: [] });
    await saveStore(firstStore);

    const secondStore = await createPersistentStore(dataFile);
    assert.equal(secondStore.orders.length, 1);
    assert.equal(secondStore.orders[0].customerName, '持久化客户');
    assert.equal(secondStore.sessions.size, 0);
  });
});
