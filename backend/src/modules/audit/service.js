import { ok } from '../../http.js';
import { authorize } from '../identity/service.js';

export function listAuditLogs({ headers, store }) {
  authorize(headers, store, 'audit:read');
  return ok([...store.auditLogs].sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
}
