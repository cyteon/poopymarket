// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (e.message.includes("ResizeObserver loop completed")) {
      e.stopImmediatePropagation();
    }
  });
}

mount(() => <StartClient />, document.getElementById("app")!);
