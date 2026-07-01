import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { For } from "solid-js";
import Credit from "~/components/Credit";
import Navbar from "~/components/Navbar";
import { format } from "~/lib/utils";
import { getTop20 } from "~/server/leaderboard";

export default function Leaderboard() {
  const users = createAsync(() => getTop20());

  return (
    <>
      <Title>Leaderboard - PoopyMarket</Title>

      <main class="flex flex-col min-h-screen items-center">
        <Navbar />

        <div class="flex w-full px-2 justify-center my-2 lg:my-4">
          <div class="max-w-4xl w-full overflow-y-auto rounded-lg border bg-ctp-surface0">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="text-left text-sm text-ctp-subtext0!">
                  <th class="p-2 px-3">Rank</th>
                  <th class="p-2 px-3">User</th>
                  <th class="p-2 px-3">Balance</th>
                </tr>
              </thead>

              <tbody>
                <For each={users()}>
                  {(user, index) => (
                    <tr class="border-t">
                      <td class="p-2 px-3">#{index() + 1}</td>

                      <td class="p-2 px-3">{user.username}</td>

                      <td class="p-2 px-3 inline-flex items-center justify-end gap-1">
                        <Credit />
                        {format(user.balance)}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
