import { createAsync } from "@solidjs/router";
import { For } from "solid-js";
import Marketcard from "~/components/Marketcard";
import Navbar from "~/components/Navbar";
import { getMarkets } from "~/server/markets";

export default function Home() {
  const markets = createAsync(getMarkets);

  return (
    <main class="flex flex-col min-h-screen">
      <Navbar />

      <div class="flex w-full justify-center mt-2">
        <div class="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-">
          <For each={markets()}>
            {(market) => <Marketcard market={market} />}
          </For>
        </div>
      </div>
    </main>
  );
}
