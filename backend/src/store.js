export function createStore() {
  const permissions = [
    { id: 'perm-user-read', code: 'user:read', name: '查看用户', resource: 'users', action: 'read' },
    { id: 'perm-user-write', code: 'user:write', name: '维护用户', resource: 'users', action: 'write' },
    { id: 'perm-material-write', code: 'material:write', name: '维护入库', resource: 'material-inbounds', action: 'write' },
    { id: 'perm-order-write', code: 'order:write', name: '维护订单', resource: 'orders', action: 'write' },
    { id: 'perm-process-write', code: 'process:write', name: '维护工序', resource: 'process-tasks', action: 'write' },
    { id: 'perm-report-read', code: 'report:read', name: '查看报表', resource: 'reports', action: 'read' }
  ];

  const roles = [
    { id: 'role-admin', code: 'admin', name: '系统管理员', permissionIds: permissions.map((permission) => permission.id) },
    { id: 'role-warehouse', code: 'warehouse', name: '仓库员', permissionIds: ['perm-material-write', 'perm-report-read'] },
    { id: 'role-production', code: 'production', name: '生产员', permissionIds: ['perm-process-write', 'perm-report-read'] }
  ];

  const users = [
    {
      id: 'user-admin',
      username: 'admin',
      displayName: '系统管理员',
      password: 'admin123',
      roleIds: ['role-admin'],
      status: 'active'
    }
  ];

  return {
    permissions,
    roles,
    users,
    sessions: new Map(),
    materialInbounds: [],
    inventoryTransactions: [],
    orders: [],
    processRoutes: [],
    processTasks: [],
    auditLogs: [],
    counters: {
      materialInbound: 0,
      inventoryTransaction: 0,
      order: 0,
      processRoute: 0,
      processTask: 0,
      auditLog: 0,
      user: users.length,
      role: roles.length
    }
  };
}

export const store = createStore();

export function nextId(prefix, counterName, targetStore = store) {
  targetStore.counters[counterName] += 1;
  return `${prefix}-${String(targetStore.counters[counterName]).padStart(4, '0')}`;
}

export function recordAudit(targetStore, actor, action, entityType, entityId, details = {}) {
  const auditLog = {
    id: nextId('audit', 'auditLog', targetStore),
    actorId: actor?.id ?? 'anonymous',
    action,
    entityType,
    entityId,
    details,
    createdAt: new Date().toISOString()
  };
  targetStore.auditLogs.push(auditLog);
  return auditLog;
}
