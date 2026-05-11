import { created, forbidden, ok, requireFields, unauthorized } from '../../http.js';
import { nextId, recordAudit } from '../../store.js';

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function generateToken(user) {
  return `dev-token-${user.id}-${Date.now()}`;
}

export function authenticate(headers, targetStore) {
  const header = headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token || !targetStore.sessions.has(token)) {
    unauthorized();
  }
  const userId = targetStore.sessions.get(token);
  const user = targetStore.users.find((candidate) => candidate.id === userId && candidate.status === 'active');
  if (!user) {
    unauthorized();
  }
  return user;
}

export function hasPermission(user, permissionCode, targetStore) {
  const rolePermissionIds = targetStore.roles
    .filter((role) => user.roleIds.includes(role.id))
    .flatMap((role) => role.permissionIds);
  return targetStore.permissions.some((permission) => rolePermissionIds.includes(permission.id) && permission.code === permissionCode);
}

export function authorize(headers, targetStore, permissionCode) {
  const user = authenticate(headers, targetStore);
  if (!hasPermission(user, permissionCode, targetStore)) {
    forbidden();
  }
  return user;
}

export function login({ body, store }) {
  requireFields(body, ['username', 'password']);
  const user = store.users.find(
    (candidate) => candidate.username === body.username && candidate.password === body.password && candidate.status === 'active'
  );
  if (!user) {
    unauthorized('用户名或密码错误');
  }

  const token = generateToken(user);
  store.sessions.set(token, user.id);
  recordAudit(store, user, 'login', 'user', user.id);
  return ok({ token, user: sanitizeUser(user) });
}

export function logout({ headers, store }) {
  const user = authenticate(headers, store);
  const token = headers.authorization.slice('Bearer '.length);
  store.sessions.delete(token);
  recordAudit(store, user, 'logout', 'user', user.id);
  return ok({ loggedOut: true });
}

export function listUsers({ headers, store }) {
  authorize(headers, store, 'user:read');
  return ok(store.users.map(sanitizeUser));
}

export function createUser({ body, headers, store }) {
  const actor = authorize(headers, store, 'user:write');
  requireFields(body, ['username', 'displayName', 'password']);
  const user = {
    id: nextId('user', 'user', store),
    username: body.username,
    displayName: body.displayName,
    password: body.password,
    roleIds: body.roleIds ?? [],
    status: body.status ?? 'active',
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  };
  store.users.push(user);
  recordAudit(store, actor, 'create', 'user', user.id);
  return created(sanitizeUser(user));
}

export function listRoles({ headers, store }) {
  authorize(headers, store, 'user:read');
  return ok(store.roles);
}

export function createRole({ body, headers, store }) {
  const actor = authorize(headers, store, 'user:write');
  requireFields(body, ['code', 'name']);
  const role = {
    id: nextId('role', 'role', store),
    code: body.code,
    name: body.name,
    permissionIds: body.permissionIds ?? [],
    createdAt: new Date().toISOString(),
    createdBy: actor.id
  };
  store.roles.push(role);
  recordAudit(store, actor, 'create', 'role', role.id);
  return created(role);
}

export function listPermissions({ headers, store }) {
  authorize(headers, store, 'user:read');
  return ok(store.permissions);
}
