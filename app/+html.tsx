import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

/**
 * The HTML shell for the web build.
 *
 * Runs only in Node during rendering, never in the browser, so it cannot use
 * hooks tied to app state. It exists to inject what Expo no longer provides out
 * of the box: the web manifest, theme colour, and service worker registration.
 *
 * `{headNodes}` is mandatory, not optional decoration — it carries the
 * generated metadata *and* the react-native-web stylesheet. Omitting it ships a
 * page where every View falls back to `display: block`, which collapses the
 * entire app into the top-left corner and loads no fonts.
 */
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="id" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>Ascendom</title>
        <meta
          name="description"
          content="Naik setiap hari, kuasai kerajaanmu. Habit tracker pixel-art bertema kerajaan."
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/*
          "black", not "black-translucent": translucent lets the page run under
          the clock and battery, and on iPhone it also leaves the app one status
          bar short at the bottom. With "black" iOS lays the app out below the
          status bar. Note iOS reads this only when the icon is added to the
          home screen, so an existing install must be re-added to pick it up.
        */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Ascendom" />

        {/* Stops the body bouncing on iOS so the app feels native. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: BASE_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_REGISTRATION }} />

        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const BASE_STYLE = `
body {
  background-color: #000000;
  overscroll-behavior-y: none;
}
/*
 * Keep content out from under a notch or status bar wherever the page does run
 * edge to edge (viewport-fit=cover). Zero where there is no inset, including
 * the home-screen app with the "black" status bar above.
 */
#root {
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
}
/* Pixel art must never be smoothed by the browser's image scaler. */
img, svg {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
`;

/**
 * Registered after `load` so fetching the worker never competes with the first
 * paint, and skipped on localhost because a cached app shell in development
 * hides every change you make.
 */
const SERVICE_WORKER_REGISTRATION = `
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (error) {
      console.warn('Service worker registration failed:', error);
    });
  });
}
`;
