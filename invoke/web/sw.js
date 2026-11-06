// Invoke (Seance Chat) service worker: shows push notifications, opens the right
// thread on tap, and keeps the app shell so it opens without the network.
const SHELL = "seance-chat-v10";
const FILES = ["/", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== SHARED).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Android's share sheet posts the photo or video here (manifest share_target). Keep it
// in a cache for the page, which asks which circle it goes to.
const SHARED = "invoke-shared";
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "POST" || url.pathname !== "/share") return;
  e.respondWith((async () => {
    const form = await e.request.formData();
    const file = form.getAll("media").find(f => f && f.size);
    const text = [form.get("title"), form.get("text"), form.get("url")].filter(Boolean).join("\n");
    const c = await caches.open(SHARED);
    await c.delete("/shared/file");
    if (file) await c.put("/shared/file", new Response(file, { headers: { "Content-Type": file.type } }));
    await c.put("/shared/text", new Response(text));
    return Response.redirect("/#/share", 303);
  })());
});

// Network first for the shell (always the newest page), cache when offline.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && FILES.includes(url.pathname)) {
      const copy = r.clone();
      caches.open(SHELL).then(c => c.put(e.request, copy));
    }
    return r;
  }).catch(() => caches.match(e.request)));
});

// The thread a page has on screen, or null when it doesn't answer within half a second.
function showing(client) {
  return new Promise(resolve => {
    const ch = new MessageChannel();
    const t = setTimeout(() => resolve(null), 500);
    ch.port1.onmessage = e => { clearTimeout(t); resolve(e.data); };
    client.postMessage({ type: "showing" }, [ch.port2]);
  });
}

// One notification for every chat with news, never a stack: Android draws a stacked
// group with a generic double-square icon Invoke can't change.
const TAG = "invoke";
async function newsByChat() {
  const [n] = await self.registration.getNotifications({ tag: TAG });
  return n?.data?.chats || {};
}
async function showNews(chats, loud) {
  const list = Object.entries(chats).sort((a, b) => b[1].ts - a[1].ts);
  for (const n of await self.registration.getNotifications()) if (n.tag !== TAG) n.close();  // pre-digest ones
  if (!list.length) {
    for (const n of await self.registration.getNotifications({ tag: TAG })) n.close();
    return;
  }
  const [ws, top] = list[0];
  const one = list.length === 1;
  await self.registration.showNotification(one ? top.title : list.length + " chats", {
    body: one ? top.body : list.map(([, c]) => c.title + ": " + c.body.split("\n")[0]).join("\n"),
    tag: TAG,
    renotify: loud,
    silent: !loud,
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    data: { ws, chats },
  });
}

// Pushes and read messages each read, change and re-show the one notification: run
// them one at a time so two close together can't drop a line.
let queue = Promise.resolve();
const inTurn = work => (queue = queue.then(work, work));

self.addEventListener("push", e => {
  const d = e.data ? e.data.json() : { title: "Invoke", body: "" };
  e.waitUntil(inTurn(async () => {
    // Skip the banner (and badge) when that thread is already on screen. Ask each
    // page what it shows: the installed Android app's focused and url can't be trusted.
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const shows = await Promise.all(open.map(showing));
    if (shows.includes(d.ws)) return;
    if (self.navigator.setAppBadge) self.navigator.setAppBadge(d.unread || 0).catch(() => {});
    const chats = await newsByChat();
    chats[d.ws] = { title: d.title, body: d.body || "", ts: Date.now() };
    await showNews(chats, true);
  }));
});

// A page read a chat (or opened Invoke): drop that chat's line, or every line.
self.addEventListener("message", e => {
  if (e.data?.type !== "read") return;
  e.waitUntil(inTurn(async () => {
    // Pages call this on every refresh: only touch the notification when its list changes.
    const chats = await newsByChat();
    if (e.data.ws ? !(e.data.ws in chats) : !Object.keys(chats).length) return;
    if (e.data.ws) delete chats[e.data.ws];
    await showNews(e.data.ws ? chats : {}, false);
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const ws = e.notification.data?.ws;
  const target = "/#/c/" + encodeURIComponent(ws || "");
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of open) {
      await c.focus();
      c.postMessage({ type: "open", ws });
      return;
    }
    await self.clients.openWindow(ws ? target : "/");
  })());
});
