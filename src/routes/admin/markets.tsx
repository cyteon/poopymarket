import { createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Credit from "~/components/Credit";
import { format } from "~/lib/utils";
import { getMarkets } from "~/server/admin";

export default function Markets() {
  const markets = createAsync(() => getMarkets());

  return (
    <main class="flex w-full">
      <div class="w-full overflow-y-auto rounded-lg border bg-ctp-surface0">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-left text-sm text-ctp-subtext0!">
              <th class="p-2 px-3">ID</th>
              <th class="p-2 px-3">Creator</th>
              <th class="p-2 px-3">Question</th>
              <th class="p-2 px-3">Volume</th>
              <th class="p-2 px-3">Resolution</th>
            </tr>
          </thead>

          <tbody>
            <For each={markets()}>
              {(market) => (
                <tr class="border-t">
                  <td class="p-2 px-3">{market.id}</td>

                  <td class="p-2 px-3">{market.creator}</td>

                  <td class="p-2 px-3">{market.question}</td>

                  <td class="p-2 px-3 inline-flex items-center justify-end gap-1">
                    <Credit />
                    {format(market.volume)}
                  </td>

                  <td
                    class={`p-2 px-3 ${
                      market.resolution === "YES"
                        ? "text-ctp-green"
                        : market.resolution === "NO"
                          ? "text-ctp-red"
                          : "text-ctp-subtext0"
                    }`}
                  >
                    <Show when={market.resolution} fallback="Unresolved">
                      {market.resolution === "YES"
                        ? "YES"
                        : market.resolution === "NO"
                          ? "NO"
                          : "N/A"}
                    </Show>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </main>
  );
}
