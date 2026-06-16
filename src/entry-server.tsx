// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

const warn = console.warn;
console.warn = (msg, ...rest) => {
  if (msg === "No route matched for preloading js assets") return;
  warn(msg, ...rest);
};

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.png" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
