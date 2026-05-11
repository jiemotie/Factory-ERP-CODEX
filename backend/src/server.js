import { createServer } from 'node:http';
import { createRouter } from './router.js';
import { routes } from './routes.js';
import { store } from './store.js';

export function createApp(targetStore = store) {
  return createServer(createRouter({ routes, store: targetStore }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => {
    console.log(`Factory ERP backend API listening on http://localhost:${port}`);
  });
}
