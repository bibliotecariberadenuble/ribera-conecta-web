const CACHE='ribera-public-v3';
const BASE=new URL('./',self.location.href);
const FILES=['','index.html','style.css','app.js','api-config.js','native-push.js','quick-actions.js','community.js','icon-192.png','icon-512.png','manifest.webmanifest','insignia-escuela.png','insignia-slep.png'];
const ASSETS=FILES.map(x=>new URL(x,BASE).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ribera-public-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!ASSETS.includes(e.request.url))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(async()=>await caches.match(e.request)||Response.error()))});
self.addEventListener('push',e=>e.waitUntil(self.registration.showNotification('La Ribera de Ñuble Conecta',{body:'Tienes una comunicación escolar. Abre la aplicación para leerla.',icon:new URL('icon-192.png',BASE).href,data:{url:BASE.href}})));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(BASE.href))});
