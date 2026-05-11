const state = {
  token: sessionStorage.getItem('factoryErpToken'),
  user: JSON.parse(sessionStorage.getItem('factoryErpUser') || 'null')
};

const statusText = {
  draft: '草稿',
  approved: '已审核',
  confirmed: '已入库',
  cancelled: '已取消',
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完工',
  rework: '返工',
  active: '启用'
};

const columns = {
  users: [
    ['id', '用户 ID'],
    ['username', '用户名'],
    ['displayName', '显示名'],
    ['roleIds', '角色 ID'],
    ['status', '状态']
  ],
  roles: [
    ['id', '角色 ID'],
    ['code', '编码'],
    ['name', '名称'],
    ['permissionIds', '权限 ID']
  ],
  permissions: [
    ['id', '权限 ID'],
    ['code', '编码'],
    ['name', '名称'],
    ['resource', '资源'],
    ['action', '动作']
  ],
  materialInbounds: [
    ['inboundNo', '入库单号'],
    ['supplierName', '供应商'],
    ['status', '状态'],
    ['inboundDate', '入库日期'],
    ['items', '明细']
  ],
  inventoryBalances: [
    ['materialCode', '物料编码'],
    ['materialName', '物料名称'],
    ['batchNo', '批次'],
    ['quantity', '当前数量'],
    ['unit', '单位']
  ],
  inventoryTransactions: [
    ['transactionNo', '流水号'],
    ['materialCode', '物料编码'],
    ['materialName', '物料名称'],
    ['batchNo', '批次'],
    ['quantity', '数量'],
    ['unit', '单位'],
    ['sourceNo', '来源单号']
  ],
  orders: [
    ['orderNo', '订单号'],
    ['customerName', '客户'],
    ['status', '状态'],
    ['deliveryDate', '交期'],
    ['items', '明细'],
    ['processTaskIds', '工序任务']
  ],
  processTasks: [
    ['id', '任务 ID'],
    ['orderId', '订单 ID'],
    ['processName', '工序'],
    ['status', '状态'],
    ['assigneeId', '负责人'],
    ['outputQuantity', '产出'],
    ['defectQuantity', '不良']
  ],
  auditLogs: [
    ['createdAt', '时间'],
    ['actorId', '操作人'],
    ['action', '动作'],
    ['entityType', '对象类型'],
    ['entityId', '对象 ID'],
    ['details', '详情']
  ]
};

const $ = (selector) => document.querySelector(selector);

const tableState = new Map();

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object') {
          return Object.entries(item)
            .map(([key, nestedValue]) => `${escapeHtml(key)}:${escapeHtml(nestedValue)}`)
            .join(' / ');
        }
        return escapeHtml(item);
      })
      .join('；');
  }
  return escapeHtml(statusText[value] ?? value ?? '-');
}

function flattenValue(value) {
  if (Array.isArray(value)) {
    return value.map(flattenValue).join(' ');
  }
  if (value && typeof value === 'object') {
    return Object.values(value).map(flattenValue).join(' ');
  }
  return String(statusText[value] ?? value ?? '');
}

function getTableState(target) {
  if (!tableState.has(target)) {
    tableState.set(target, { page: 1, pageSize: 10, keyword: '' });
  }
  return tableState.get(target);
}

function downloadCsv(filename, rows, tableColumns) {
  const header = tableColumns.map(([, label]) => label);
  const body = rows.map((row) => tableColumns.map(([key]) => flattenValue(row[key])));
  const csv = [header, ...body]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderTable(target, rows, tableColumns, actions = () => []) {
  const container = $(target);
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="empty">暂无数据，请先通过上方表格表单录入。</div>';
    return;
  }

  const current = getTableState(target);
  const keyword = current.keyword.trim().toLowerCase();
  const filteredRows = keyword ? rows.filter((row) => flattenValue(row).toLowerCase().includes(keyword)) : rows;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / current.pageSize));
  current.page = Math.min(Math.max(current.page, 1), totalPages);
  const start = (current.page - 1) * current.pageSize;
  const pageRows = filteredRows.slice(start, start + current.pageSize);
  const hasActions = rows.some((row) => actions(row).length > 0);

  container.innerHTML = `
    <div class="table-toolbar">
      <label class="table-search">关键字筛选<input data-role="table-keyword" value="${escapeHtml(current.keyword)}" placeholder="输入任意字段筛选" /></label>
      <label class="table-size">每页<select data-role="table-page-size">
        ${[5, 10, 20, 50].map((size) => `<option value="${size}" ${size === current.pageSize ? 'selected' : ''}>${size}</option>`).join('')}
      </select> 条</label>
      <button class="secondary" data-role="table-export" type="button">导出 CSV</button>
      <span class="table-count">共 ${rows.length} 条，筛选后 ${filteredRows.length} 条</span>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            ${tableColumns.map(([, label]) => `<th>${label}</th>`).join('')}
            ${hasActions ? '<th>操作</th>' : ''}
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="table-pagination">
      <button class="secondary" data-role="table-prev" type="button" ${current.page === 1 ? 'disabled' : ''}>上一页</button>
      <span>第 ${current.page} / ${totalPages} 页</span>
      <button class="secondary" data-role="table-next" type="button" ${current.page === totalPages ? 'disabled' : ''}>下一页</button>
    </div>
  `;

  const tbody = container.querySelector('tbody');
  if (pageRows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="${tableColumns.length + (hasActions ? 1 : 0)}">未找到匹配数据</td>`;
    tbody.append(tr);
  }

  pageRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = tableColumns.map(([key]) => `<td>${formatValue(row[key])}</td>`).join('');
    const rowActions = actions(row);
    if (hasActions) {
      const td = document.createElement('td');
      td.className = 'actions';
      rowActions.forEach((action) => td.append(action));
      tr.append(td);
    }
    tbody.append(tr);
  });

  container.querySelector('[data-role="table-keyword"]').addEventListener('input', (event) => {
    current.keyword = event.target.value;
    current.page = 1;
    renderTable(target, rows, tableColumns, actions);
  });
  container.querySelector('[data-role="table-page-size"]').addEventListener('change', (event) => {
    current.pageSize = Number(event.target.value);
    current.page = 1;
    renderTable(target, rows, tableColumns, actions);
  });
  container.querySelector('[data-role="table-export"]').addEventListener('click', () => {
    downloadCsv(`${target.replace('#', '')}.csv`, filteredRows, tableColumns);
  });
  container.querySelector('[data-role="table-prev"]').addEventListener('click', () => {
    current.page -= 1;
    renderTable(target, rows, tableColumns, actions);
  });
  container.querySelector('[data-role="table-next"]').addEventListener('click', () => {
    current.page += 1;
    renderTable(target, rows, tableColumns, actions);
  });
}

async function api(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  const payload = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? '请求失败');
  }
  return payload.data;
}

function makeButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  button.addEventListener('click', onClick);
  return button;
}

function toFormObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function syncSession() {
  $('#login-panel').hidden = Boolean(state.token);
  $('#workspace').hidden = !state.token;
  $('#logout-button').hidden = !state.token;
  $('#session-status').textContent = state.user ? `已登录：${state.user.displayName}` : '未登录';
}

async function refreshIdentity() {
  const [users, roles, permissions] = await Promise.all([api('/users'), api('/roles'), api('/permissions')]);
  renderTable('#users-table', users, columns.users);
  renderTable('#roles-table', roles, columns.roles);
  renderTable('#permissions-table', permissions, columns.permissions);
}

async function refreshMaterial() {
  const rows = await api('/material-inbounds');
  renderTable('#material-inbounds-table', rows, columns.materialInbounds, (row) => [
    row.status === 'draft'
      ? makeButton('审核', 'secondary', async () => {
          await api(`/material-inbounds/${row.id}/approve`, { method: 'POST' });
          showToast('入库单已审核');
          await refreshAll(['material', 'inventory', 'reports']);
        })
      : null,
    row.status === 'approved'
      ? makeButton('确认入库', '', async () => {
          await api(`/material-inbounds/${row.id}/confirm`, { method: 'POST' });
          showToast('已确认入库并生成库存流水');
          await refreshAll(['material', 'inventory', 'reports']);
        })
      : null
  ].filter(Boolean));
}

async function refreshInventory() {
  const [balances, transactions] = await Promise.all([api('/inventory-balances'), api('/inventory-transactions')]);
  renderTable('#inventory-balances-table', balances, columns.inventoryBalances);
  renderTable('#inventory-transactions-table', transactions, columns.inventoryTransactions);
}

async function refreshOrders() {
  const rows = await api('/orders');
  renderTable('#orders-table', rows, columns.orders, (row) => [
    row.status === 'draft'
      ? makeButton('审核', 'secondary', async () => {
          await api(`/orders/${row.id}/approve`, { method: 'POST' });
          showToast('订单已审核');
          await refreshAll(['orders', 'reports']);
        })
      : null,
    row.status === 'approved' && !(Array.isArray(row.processTaskIds) && row.processTaskIds.length > 0)
      ? makeButton('生成工序', '', async () => {
          const names = prompt('请输入工序名称，多个工序用逗号分隔', '下料,加工,质检');
          if (!names) {
            return;
          }
          await api(`/orders/${row.id}/generate-process-tasks`, {
            method: 'POST',
            body: JSON.stringify({ processNames: names.split(',').map((item) => item.trim()).filter(Boolean) })
          });
          showToast('已从订单生成工序任务');
          await refreshAll(['orders', 'process', 'reports', 'audit']);
        })
      : null,
    ['draft', 'approved'].includes(row.status)
      ? makeButton('取消', 'danger', async () => {
          await api(`/orders/${row.id}/cancel`, { method: 'POST' });
          showToast('订单已取消');
          await refreshAll(['orders', 'reports', 'audit']);
        })
      : null
  ].filter(Boolean));
}

async function refreshProcess() {
  const rows = await api('/process-tasks');
  renderTable('#process-tasks-table', rows, columns.processTasks, (row) => [
    ['pending', 'rework'].includes(row.status)
      ? makeButton('开工', 'secondary', async () => {
          await api(`/process-tasks/${row.id}/start`, { method: 'POST' });
          showToast('工序任务已开工');
          await refreshAll(['process', 'reports']);
        })
      : null,
    row.status === 'in_progress'
      ? makeButton('完工', '', async () => {
          const outputQuantity = Number(prompt('请输入产出数量', '10') ?? 0);
          const defectQuantity = Number(prompt('请输入不良数量', '0') ?? 0);
          await api(`/process-tasks/${row.id}/complete`, {
            method: 'POST',
            body: JSON.stringify({ outputQuantity, defectQuantity })
          });
          showToast('工序任务已完工');
          await refreshAll(['process', 'reports']);
        })
      : null,
    row.status === 'completed'
      ? makeButton('返工', 'danger', async () => {
          await api(`/process-tasks/${row.id}/rework`, {
            method: 'POST',
            body: JSON.stringify({ reason: prompt('请输入返工原因', '质量复检') ?? '质量复检' })
          });
          showToast('工序任务已返工');
          await refreshAll(['process', 'reports']);
        })
      : null
  ].filter(Boolean));
}

async function refreshAudit() {
  const rows = await api('/audit-logs');
  renderTable('#audit-logs-table', rows, columns.auditLogs);
}

async function refreshReports() {
  const [inbound, order, capacity, quality, inventory] = await Promise.all([
    api('/reports/material-inbound-summary'),
    api('/reports/order-progress'),
    api('/reports/process-capacity'),
    api('/reports/quality-rate'),
    api('/reports/inventory-balance')
  ]);
  $('#report-cards').innerHTML = [
    ['入库单总数', inbound.totalInboundOrders],
    ['已入库单数', inbound.confirmedInboundOrders],
    ['订单总数', order.totalOrders],
    ['完工任务数', capacity.completedTasks],
    ['良率', `${(quality.qualityRate * 100).toFixed(2)}%`]
  ]
    .map(([label, value]) => `<div class="report-card">${label}<strong>${value}</strong></div>`)
    .join('');
  renderTable('#report-inventory-table', inventory.balances, columns.inventoryBalances);
}

const refreshers = {
  identity: refreshIdentity,
  material: refreshMaterial,
  inventory: refreshInventory,
  orders: refreshOrders,
  process: refreshProcess,
  reports: refreshReports,
  audit: refreshAudit
};

async function refreshAll(names = Object.keys(refreshers)) {
  for (const name of names) {
    await refreshers[name]();
  }
}

function bindEvents() {
  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(toFormObject(event.currentTarget))
      });
      state.token = data.token;
      state.user = data.user;
      sessionStorage.setItem('factoryErpToken', state.token);
      sessionStorage.setItem('factoryErpUser', JSON.stringify(state.user));
      syncSession();
      await refreshAll();
      showToast('登录成功');
    } catch (error) {
      showToast(error.message);
    }
  });

  $('#logout-button').addEventListener('click', async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      state.token = undefined;
      state.user = undefined;
      sessionStorage.clear();
      syncSession();
    }
  });

  document.querySelectorAll('.tabs button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      $(`#tab-${button.dataset.tab}`).classList.add('active');
    });
  });

  document.querySelectorAll('[data-refresh]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await refreshers[button.dataset.refresh]();
        showToast('表格已刷新');
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  $('#user-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = toFormObject(event.currentTarget);
    await api('/users', {
      method: 'POST',
      body: JSON.stringify({ ...form, roleIds: form.roleIds ? form.roleIds.split(',').map((item) => item.trim()) : [] })
    });
    event.currentTarget.reset();
    showToast('用户已新增');
    await refreshIdentity();
  });

  $('#material-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = toFormObject(event.currentTarget);
    await api('/material-inbounds', {
      method: 'POST',
      body: JSON.stringify({
        supplierName: form.supplierName,
        items: [
          {
            materialCode: form.materialCode,
            materialName: form.materialName,
            batchNo: form.batchNo || 'DEFAULT',
            quantity: Number(form.quantity),
            unit: form.unit
          }
        ]
      })
    });
    event.currentTarget.reset();
    showToast('入库单已新增');
    await refreshMaterial();
  });

  $('#order-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = toFormObject(event.currentTarget);
    await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: form.customerName,
        deliveryDate: form.deliveryDate,
        items: [
          {
            productCode: form.productCode,
            productName: form.productName,
            quantity: Number(form.quantity)
          }
        ]
      })
    });
    event.currentTarget.reset();
    showToast('订单已新增');
    await refreshAll(['orders', 'reports']);
  });

  $('#process-task-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = toFormObject(event.currentTarget);
    await api('/process-tasks', { method: 'POST', body: JSON.stringify(form) });
    event.currentTarget.reset();
    showToast('工序任务已新增');
    await refreshAll(['process', 'reports']);
  });
}

bindEvents();
syncSession();
if (state.token) {
  refreshAll().catch((error) => showToast(error.message));
}
