import { createAsync } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import Credit from "~/components/Credit";
import { format } from "~/lib/utils";
import { getLedger } from "~/server/admin";

export default function Ledger() {
  const [page, setPage] = createSignal(1);
  const ledger = createAsync(() => getLedger(page()));

  return (
    <main class="flex flex-col w-full">
      <div class="flex items-center justify-between rounded-lg border bg-ctp-surface0 p-2 px-3 mb-2 w-fit text-sm">
        <span>
          Page {page()} / {ledger()?.pageCount}
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
            disabled={ledger()?.d.length === 0}
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
              <th class="p-2 px-3">User</th>
              <th class="p-2 px-3">Amount</th>
              <th class="p-2 px-3">Description</th>
              <th class="p-2 px-3">Created At</th>
            </tr>
          </thead>

          <tbody>
            <For each={ledger()?.d}>
              {(entry) => (
                <tr class="border-t">
                  <td class="p-2 px-3">{entry.id}</td>

                  <td class="p-2 px-3">{entry.user}</td>

                  <td
                    class={`p-2 px-3 inline-flex items-center justify-end gap-1 font-bold ${entry.amount > 0 ? "text-ctp-green" : "text-ctp-red"}`}
                  >
                    <Credit />
                    {format(entry.amount)}
                  </td>

                  <td class="p-2 px-3">{entry.description}</td>

                  <td class="p-2 px-3">
                    {new Date(entry.createdAt).toLocaleString()}
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
