export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok(data, status = 200) {
  return { status, body: { data } };
}

export function created(data) {
  return ok(data, 201);
}

export function noContent() {
  return { status: 204, body: undefined };
}

export function badRequest(message, details) {
  throw new HttpError(400, message, details);
}

export function unauthorized(message = '未认证或登录已过期') {
  throw new HttpError(401, message);
}

export function forbidden(message = '权限不足') {
  throw new HttpError(403, message);
}

export function notFound(message = '资源不存在') {
  throw new HttpError(404, message);
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length > 0) {
    badRequest('缺少必填字段', { missing });
  }
}
