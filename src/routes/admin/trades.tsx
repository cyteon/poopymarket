import { createAsync } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import Credit from "~/components/Credit";
import { format } from "~/lib/utils";
import { getTrades } from "~/server/admin";

export default function Trades() {
  const [page, setPage] = createSignal(1);
  const trades = createAsync(() => getTrades(page()));

  return (
    <main class="flex flex-col w-full">
      <div class="flex items-center justify-between rounded-lg border bg-ctp-surface0 p-2 px-3 mb-2 w-fit text-sm">
        <span>
          Page {page()} / {trades()?.pageCount}
        </span>

        <div class="flex items-center gap-2 ml-8">
          <button
            class="px-2 py-0.5 rounded-lg ghost border-ctp-surface1! disabled:opacity-50 enabled:hover:border-ctp-surface2!"
            disabled={page() === 1}
            onClick={() => setPage(page() - 1)}
          >
            Prev
          </button>

          <button
            class="px-2 py-0.5 rounded-lg ghost border-ctp-surface1! disabled:opacity-50 enabled:hover:border-ctp-surface2!"
            disabled={trades()?.d.length === 0}
            onClick={() => setPage(page() + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <div class="w-full overflow-y-auto rounded-lg border bg-ctp-surface0">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-left text-sm text-ctp-subtext0!">
              <th class="p-2 px-3">ID</th>
              <th class="p-2 px-3">Market ID</th>
              <th class="p-2 px-3">User</th>
              <th class="p-2 px-3">Outcome</th>
              <th class="p-2 px-3">Price</th>
              <th class="p-2 px-3">Shares</th>
            </tr>
          </thead>

          <tbody>
            <For each={trades()?.d}>
              {(trade) => (
                <tr class="border-t">
                  <td class="p-2 px-3">{trade.id}</td>

                  <td class="p-2 px-3">{trade.market}</td>

                  <td class="p-2 px-3">{trade.user}</td>

                  <td
                    class={`p-2 px-3 ${trade.outcome === "YES" ? "text-ctp-green" : "text-ctp-red"}`}
                  >
                    {trade.outcome}
                  </td>

                  <td class="p-2 px-3 inline-flex items-center justify-end gap-1">
                    <Credit />
                    {format(trade.price)}
                  </td>

                  <td class="p-2 px-3">{format(trade.shares)}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </main>
  );
}
