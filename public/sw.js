if (!self.define) {
  let e,
    s = {};
  const n = (n, a) => (
    (n = new URL(n + ".js", a).href),
    s[n] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = n), (e.onload = s), document.head.appendChild(e));
        } else ((e = n), importScripts(n), s());
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, i) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[t]) return;
    let c = {};
    const r = (e) => n(e, t),
      f = { module: { uri: t }, exports: c, require: r };
    s[t] = Promise.all(a.map((e) => f[e] || r(e))).then((e) => (i(...e), c));
  };
}
define(["./workbox-f1770938"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/static/chunks/14-5725726d03c3af7b.js",
          revision: "5725726d03c3af7b",
        },
        {
          url: "/_next/static/chunks/150-696f54a71aa1f1c1.js",
          revision: "696f54a71aa1f1c1",
        },
        {
          url: "/_next/static/chunks/342.ad97950c59694236.js",
          revision: "ad97950c59694236",
        },
        {
          url: "/_next/static/chunks/398-ff5a6b07efe1efb5.js",
          revision: "ff5a6b07efe1efb5",
        },
        {
          url: "/_next/static/chunks/4bd1b696-dfbe61834be6cb14.js",
          revision: "dfbe61834be6cb14",
        },
        {
          url: "/_next/static/chunks/555-d6aa6acceb1afa71.js",
          revision: "d6aa6acceb1afa71",
        },
        {
          url: "/_next/static/chunks/905-d2fbaa08d171e523.js",
          revision: "d2fbaa08d171e523",
        },
        {
          url: "/_next/static/chunks/971.a38d5ff087d31da9.js",
          revision: "a38d5ff087d31da9",
        },
        {
          url: "/_next/static/chunks/app/_global-error/page-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-d8df77de3046c33f.js",
          revision: "d8df77de3046c33f",
        },
        {
          url: "/_next/static/chunks/app/amigos/page-4b7315b68f2af836.js",
          revision: "4b7315b68f2af836",
        },
        {
          url: "/_next/static/chunks/app/config/page-25507e37a1f98954.js",
          revision: "25507e37a1f98954",
        },
        {
          url: "/_next/static/chunks/app/layout-c1bf8d6f9bf506ac.js",
          revision: "c1bf8d6f9bf506ac",
        },
        {
          url: "/_next/static/chunks/app/page-ef79a218d269dd30.js",
          revision: "ef79a218d269dd30",
        },
        {
          url: "/_next/static/chunks/framework-75892d61b920805f.js",
          revision: "75892d61b920805f",
        },
        {
          url: "/_next/static/chunks/main-5b7cb4e870353303.js",
          revision: "5b7cb4e870353303",
        },
        {
          url: "/_next/static/chunks/main-app-fa36851bf70d137a.js",
          revision: "fa36851bf70d137a",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/app-error-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/forbidden-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/global-error-f13f673fa370b150.js",
          revision: "f13f673fa370b150",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/not-found-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/unauthorized-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-bb941a5408616b2f.js",
          revision: "bb941a5408616b2f",
        },
        {
          url: "/_next/static/css/670e4dadff2cbb76.css",
          revision: "670e4dadff2cbb76",
        },
        {
          url: "/_next/static/mcbJJ0X_ueQbacs89Tf9-/_buildManifest.js",
          revision: "3c848ac2013bdc2bcc6d6dc343287035",
        },
        {
          url: "/_next/static/mcbJJ0X_ueQbacs89Tf9-/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        { url: "/file.svg", revision: "d09f95206c3fa0bb9bd9fefabfd0ea71" },
        { url: "/globe.svg", revision: "2aaafa6a49b6563925fe440891e32717" },
        {
          url: "/icons/icon-192x192.png",
          revision: "d6e793cdf87c6654ffadcd5c7122e893",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "27c40d426dc0c5943fb8831eadc693e5",
        },
        { url: "/manifest.json", revision: "23fc7e83f14226386599dccdb9912207" },
        { url: "/next.svg", revision: "8e061864f388b47f33a1c3780831193e" },
        {
          url: "/swe-worker-5c72df51bb1f6ee0.js",
          revision: "76fdd3369f623a3edcf74ce2200bfdd0",
        },
        { url: "/vercel.svg", revision: "c0af2f507b369b085b35ef4bbe3bcf1e" },
        { url: "/window.svg", revision: "a2760511c65806022ad20adf74370ff3" },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: s } }) =>
        !(!e || s.startsWith("/api/auth/callback") || !s.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: s }, sameOrigin: n }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        n &&
        !s.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: s }, sameOrigin: n }) =>
        "1" === e.headers.get("RSC") && n && !s.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: s }) => s && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
  // Escuchar mensajes desde el Sidebar
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "NUEVA_CLASE") {
      const { nombre, salon, profesor, rango } = event.data.payload;

      // Esta es la notificación que aparece aunque la pestaña esté en 2do plano
      self.registration.showNotification(`¡Ahora tienes la clase: ${nombre}!`, {
        body: `Salón: ${salon}\n${rango}\nCon "${profesor}"`,
        icon: "/icons/icon-192x192.png", // Usa la ruta de tus iconos
        badge: "/icons/icon-192x192.png",
        tag: "cambio-clase", // Evita que se amontonen
        renotify: true,
        vibrate: [200, 100, 200],
      });
    }
  });

  // Hacer que al tocar la notificación se abra la app
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) return clientList[0].focus();
          return clients.openWindow("/");
        }),
    );
  });
});
