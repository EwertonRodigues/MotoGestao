// Esqueleto da etapa 1. Não intercepta requisições e não oferece cache offline.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
