import { HttpError, notFound } from './http.js';
import { saveStore } from './persistence.js';

function splitPath(pathname) {
  return pathname.split('/').filter(Boolean);
}

function matchRoute(pattern, pathname) {
  const patternParts = splitPath(pattern);
  const pathParts = splitPath(pathname);
  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
}

async function parseJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, '请求体必须是有效 JSON');
  }
}

export function createRouter({ store, routes }) {
  return async function handle(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const route = routes.find((candidate) => {
      if (candidate.method !== request.method) {
        return false;
      }
      return matchRoute(candidate.path, url.pathname) !== null;
    });

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    try {
      if (!route) {
        notFound('接口不存在');
      }

      const params = matchRoute(route.path, url.pathname);
      const body = ['POST', 'PATCH', 'PUT'].includes(request.method) ? await parseJsonBody(request) : {};
      const result = await route.handler({
        body,
        headers: request.headers,
        params,
        query: Object.fromEntries(url.searchParams.entries()),
        store
      });

      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method) && result.status < 400) {
        await saveStore(store);
      }

      response.writeHead(result.status);
      if (result.body !== undefined) {
        response.end(JSON.stringify(result.body));
      } else {
        response.end();
      }
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const payload = {
        error: {
          message: status === 500 ? '服务器内部错误' : error.message,
          details: error.details
        }
      };
      response.writeHead(status);
      response.end(JSON.stringify(payload));
    }
  };
}
