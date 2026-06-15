import { createAsync, revalidate } from "@solidjs/router";
import { DollarSign, Hammer } from "lucide-solid";
import { For } from "solid-js";
import Credit from "~/components/Credit";
import { adjustBalance, getUsers, toggleBanned } from "~/server/admin";

export default function Users() {
  const users = createAsync(() => getUsers());

  async function handleBan(id: number) {
    try {
      await toggleBanned(id);
      revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleAdjustBalance(id: number) {
    const input = prompt("Enter balance change:");
    const change = parseInt(input || "0", 0);

    try {
      await adjustBalance(id, change);
      revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <main class="flex w-full">
      <div class="w-full overflow-y-auto rounded-lg border bg-ctp-surface0">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-left text-sm text-ctp-subtext0!">
              <th class="p-2 px-3">ID</th>
              <th class="p-2 px-3">Username</th>
              <th class="p-2 px-3">Email</th>
              <th class="p-2 px-3">Banned</th>
              <th class="p-2 px-3">Balance</th>
              <th class="p-2 px-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <For each={users()}>
              {(user) => (
                <tr class="border-t">
                  <td class="p-2 px-3">{user.id}</td>

                  <td class="p-2 px-3">{user.username}</td>

                  <td class="p-2 px-3">{user.email}</td>

                  <td
                    class={`p-2 px-3 ${user.banned ? "text-ctp-red" : "text-ctp-green"}`}
                  >
                    {user.banned ? "Yes" : "No"}
                  </td>

                  <td class="p-2 px-3 inline-flex items-center justify-end gap-1">
                    <Credit />
                    {user.balance}
                  </td>

                  <td class="p-2 px-3 text-right">
                    <button
                      class="ghost mr-2"
                      onClick={() => handleAdjustBalance(user.id)}
                    >
                      <DollarSign class="w-4 h-4" />
                    </button>

                    <button class="ghost" onClick={() => handleBan(user.id)}>
                      <Hammer class="w-4 h-4" />
                    </button>
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
