import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import Marketcard from "~/components/Marketcard";
import Navbar from "~/components/Navbar";
import { getUser } from "~/server/auth";
import { getMarkets } from "~/server/markets";

export const route = {
  preload: () => {
    getUser();
    getMarkets();
  },
};

export default function Home() {
  const [category, setCategory] = createSignal("*");
  const markets = createAsync(() => getMarkets(category()));

  return (
    <>
      <Title>Kalshit</Title>
      <main class="flex flex-col min-h-screen">
        <Navbar />

        <div class="flex w-full justify-center my-4 px-2">
          <div class="max-w-7xl w-full">
            <select
              value={category()}
              onChange={(e) => setCategory(e.currentTarget.value)}
              class="rounded-md border bg-ctp-mantle p-2 mb-4"
            >
              <option value="*">All categories</option>
              <option value="Tech">Tech</option>
              <option value="Politics">Politics</option>
              <option value="Sports">Sports</option>
              <option value="Finance">Finance</option>
              <option value="Gaming">Gaming</option>
              <option value="Other">Other</option>
            </select>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={markets()}>
                {(market) => <Marketcard market={market} />}
              </For>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
